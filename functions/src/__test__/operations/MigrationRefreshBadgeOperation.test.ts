import axios from "axios";
import * as dotenv from "dotenv";
import { Client } from "pg";
import ActionRun from "../../domain/ActionRun.type";
import Badge from "../../domain/Badge.type";
import BadgeMetrics from "../../domain/BadgeMetrics.type";
import MigrationBadgesRepository from "../../infrastructure/postgres/BadgesRepository";
import MigrationActionRepository from "../../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
import { getClient } from "../../infrastructure/supabase/SupabaseClient";
import { CollectActionRun } from "../../operations/CollectActionRun";
import { RefreshBadgeOperation } from "../../operations/MigrationRefreshBadgeOperation";

const utils = require("../../utils/githubUtils");

async function wipeData(client: Client) {
  const allWiped = await Promise.allSettled([
    client.query('DELETE FROM "Badges";'),
    client.query('DELETE FROM "Runs";'),
    client.query('DELETE FROM "Actions";'),
    client.query('DELETE FROM "RunErrors";'),
    client.query('DELETE FROM "AttemptedRuns";'),
    client.query('DELETE FROM "PulseRepos";'),
    client.query('DELETE FROM "MetricDefinitions";'),
  ]);

  if (allWiped.filter((q) => q.status === "rejected").length > 0)
    throw new Error("Unable to clear some relations");
}

async function setup(client: Client) {
  const run: ActionRun = {
    creator: "michmich112",
    github_action: "action",
    github_actor: "actor",
    github_base_ref: "base",
    github_head_ref: "head",
    github_ref: "ref",
    github_repository: "repository",
    github_event_name: "push",
    github_action_repository: "action_repository",
    github_run_id: "1",
    ip: "1.2.3.4",
    name: "action-name",
    runner_os: "Linux",
    runner_name: "Runner1",
    timestamp: new Date(12345).toISOString(),
    version: "version_number",
    package_version: "1.2.3",
    execution_time: [1, 123456789],
    error: {
      name: "Error",
      message: "Error encountered",
      stack: null,
    },
  };

  // create 2 normal runs and 1 attempted run
  await CollectActionRun(run); // use the operation to create the mock data

  await CollectActionRun({
    ...run,
    timestamp: new Date(123456).toISOString(),
    error: null,
  });
  // this is a attempted Run
  await CollectActionRun({
    ...run,
    timestamp: new Date().toISOString(),
    error: null,
    ip: "1.4.7.78",
  });

  // create new action
  await CollectActionRun({
    ...run,
    creator: "michmich112",
    name: "new-action",
  });

  client = (await PostgresConnectedClient()) as Client;

  const actionRepo = await MigrationActionRepository.New(client);
  const action = await actionRepo.getByCreatorAndName(
    "michmich112",
    "action-name"
  );

  const badgeRepo = await MigrationBadgesRepository.New(client);
  const badge: Badge = {
    actionId: action.id,
    metric: "rpm" as BadgeMetrics,
    lastGenerated: new Date(),
    locationPath: "test/up_to_date.svg",
    publicUri: "public/url/file.svg",
    value: "10",
  };

  await badgeRepo.createBadge(badge);
  const badge2: Badge = {
    actionId: action.id,
    metric: "runs" as BadgeMetrics,
    lastGenerated: new Date(0),
    locationPath: "test/not_up_to_date.svg",
    publicUri: "public/url/file_not_up_to_dat.svg",
    value: "12",
  };
  await badgeRepo.createBadge(badge2);
  const bbb = await client.query('SELECT * FROM "Badges";');
  console.log("SETUP SUCCESS:", JSON.stringify(bbb));
}

describe("RefreshBadgeOperation tests", () => {
  let client: Client | null = null;
  beforeAll(async function () {
    dotenv.config();
    client = await PostgresConnectedClient();
    try {
      await wipeData(client!);
    } catch (e) {
      console.warn("Error Wiping Data", e);
    }

    try {
      const supabaseClient = getClient();
      // empty all existing badges
      await supabaseClient.storage.emptyBucket("badges");

      jest
        .spyOn(utils, "isGithubActionsAddress")
        .mockImplementation(async (ip) => {
          if (ip === "9.9.9.9") {
            // mock a communication error
            throw new Error("Communication Error");
          }

          const authorizedIps = ["1.2.3.4", "5.6.7.8", "1:2:3:4:5:6:7:8"];
          return authorizedIps.includes(ip as string);
        });

      await setup(client!);
    } catch (e) {
      console.error("Setup Failure:", e);
    }
  });

  beforeEach(async function () {
    client = await PostgresConnectedClient();
  });

  afterAll(async function () {
    try {
      client = await PostgresConnectedClient();
      await wipeData(client!);
    } finally {
      await client!.end();
    }
  });

  test("it not perfom any update if the badge is already up to date", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }

    let badgeRepo = await MigrationBadgesRepository.New(client);
    const startBadge = await badgeRepo.getBadge({
      actionId: { creator: "michmich112", name: "action-name" },
      metric: "rpm" as BadgeMetrics,
    });

    await RefreshBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "rpm",
    });

    client = (await PostgresConnectedClient()) as Client;

    badgeRepo = await MigrationBadgesRepository.New(client);
    const endBadge = await badgeRepo.getBadge({
      actionId: { creator: "michmich112", name: "action-name" },
      metric: "rpm" as BadgeMetrics,
    });
    expect(endBadge).toEqual(startBadge);
  });

  test("it should perform an update on an existing not up to date badge", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }

    let badgeRepo = await MigrationBadgesRepository.New(client);
    const startBadge = await badgeRepo.getBadge({
      actionId: { creator: "michmich112", name: "action-name" },
      metric: "runs" as BadgeMetrics,
    });

    await RefreshBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "runs",
    });

    client = (await PostgresConnectedClient()) as Client;

    badgeRepo = await MigrationBadgesRepository.New(client);
    const endBadge = await badgeRepo.getBadge({
      actionId: { creator: "michmich112", name: "rpm" },
      metric: "runs" as BadgeMetrics,
    });

    expect(endBadge).not.toEqual(startBadge);
    expect(endBadge.locationPath).toEqual("test/not_up_to_date.svg");
    expect(endBadge.publicUri).not.toEqual("public/url/file_not_up_to_dat.svg");
    expect(endBadge.value).toEqual("2");
    expect(endBadge.lastGenerated).not.toEqual(new Date(0));

    // test that the uri generated properly links to the badge
    const supabaseClient = getClient();
    const test_uri = await axios.get(endBadge.publicUri);

    const { data, error } = await supabaseClient.storage
      .from("badges")
      .download(endBadge.locationPath);
    if (error) throw new Error("Unable to download badge from storage");
    expect(await data.text()).toEqual(test_uri.data);
  });

  test("it should create a badge if it does not exist currently", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }

    let badgeRepo = await MigrationBadgesRepository.New(client);
    let err = false;
    try {
      await badgeRepo.getBadge({
        actionId: { creator: "michmich112", name: "new-action" },
        metric: "runs" as BadgeMetrics,
      });
    } catch {
      err = true;
    }
    if (!err)
      throw new Error(
        "Expected no badge to exist for action michmich112/new-action"
      );

    await RefreshBadgeOperation({
      creator: "michmich112",
      name: "new-action",
      metric: "runs",
    });

    client = (await PostgresConnectedClient()) as Client;

    badgeRepo = await MigrationBadgesRepository.New(client);
    const endBadge = await badgeRepo.getBadge({
      actionId: { creator: "michmich112", name: "rpm" },
      metric: "runs" as BadgeMetrics,
    });

    expect(endBadge.locationPath).toEqual("michmich112/new-action/runs.svg");
    expect(endBadge.value).toEqual("1");

    // test that the uri generated properly links to the badge
    const supabaseClient = getClient();
    const test_uri = await axios.get(endBadge.publicUri);

    const { data, error } = await supabaseClient.storage
      .from("badges")
      .download(endBadge.locationPath);
    if (error) throw new Error("Unable to download badge from storage");
    expect(await data.text()).toEqual(test_uri.data);
  });
});
