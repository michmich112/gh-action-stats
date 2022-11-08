import { makeBadge } from "badge-maker";
import * as dotenv from "dotenv";
import { Client } from "pg";
import ActionRun from "../../domain/ActionRun.type";
import { BadgeData } from "../../domain/Badge.type";
import BadgeMetrics from "../../domain/BadgeMetrics.type";
import MigrationBadgesRepository from "../../infrastructure/postgres/BadgesRepository";
import MigrationActionRepository from "../../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
import { CollectActionRun } from "../../operations/CollectActionRun";
import { GetBadgeOperation } from "../../operations/MigrationGetBadgeOperation";

const utils = require("../../utils/githubUtils");

async function wipeData(client: Client) {
  try {
    await client.query('DELETE FROM "Runs";');
  } catch (e) {
    console.warn("Error Deleting Runs", e);
  }
  await Promise.allSettled([
    client.query('DELETE FROM "Actions";'),
    client.query('DELETE FROM "RunErrors";'),
    client.query('DELETE FROM "AttemptedRuns";'),
    client.query('DELETE FROM "PulseRepos";'),
    client.query('DELETE FROM "MetricDefinitions";'),
    client.query('DELETE FROM "BadgeViews";'),
  ]);
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

  client = (await PostgresConnectedClient()) as Client;

  const actionRepo = await MigrationActionRepository.New(client);
  const action = await actionRepo.getByCreatorAndName(
    "michmich112",
    "action-name"
  );

  const badgeRepo = await MigrationBadgesRepository.New(client);
  const badge: BadgeData = {
    actionId: action.id,
    metric: "test_upToDate" as BadgeMetrics,
    lastGenerated: new Date(),
    locationPath: "/test/up_to_date",
    publicUri: "public/url/file.svg",
    value: "10",
  };

  await badgeRepo.createBadge(badge);
  const badge2: BadgeData = {
    actionId: action.id,
    metric: "test_notUpToDate" as BadgeMetrics,
    lastGenerated: new Date(0),
    locationPath: "/test/not_up_to_date",
    publicUri: "public/url/file_not_up_to_dat.svg",
    value: "12",
  };
  await badgeRepo.createBadge(badge2);
}

describe("GetBadgeOperation test", () => {
  let client: Client | null = null;
  beforeAll(async function () {
    dotenv.config();
    client = await PostgresConnectedClient();

    try {
      await wipeData(client!);

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
      console.error(
        `[GetBadgeOperationTests][beforeAll] Error - Error setting up tests`
      );
    }
  });

  afterAll(async function () {
    try {
      await wipeData(client!);
    } catch (e) {
      console.error(`[GetBadgeOperationTests] Error - Error wiping data.`, e);
    } finally {
      await client!.end();
    }
  });

  test("it should return the URL if the badge exists and is up to date", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }
    const preBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    const res = await GetBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "test_upToDate" as BadgeMetrics,
    });
    client = (await PostgresConnectedClient()) as Client;

    const postBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;
    expect(res).toEqual({
      url: "public/url/file.svg",
      outdated: false,
    });

    expect(postBadgesLog).toEqual(preBadgesLog + 1);
  });

  test("it should return the URL and outdated if the badge is not up do date", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }
    const preBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    const res = await GetBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "test_notUpToDate" as BadgeMetrics,
    });
    client = (await PostgresConnectedClient()) as Client;

    const postBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    expect(res).toEqual({
      url: "public/url/file_not_up_to_dat.svg",
      outdated: true,
    });

    expect(postBadgesLog).toEqual(preBadgesLog + 1);
  });

  test("it should return the raw metric if no badge exists", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }

    const preBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    const res = await GetBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "runs" as BadgeMetrics,
    });
    client = (await PostgresConnectedClient()) as Client;

    const postBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    expect(res).toEqual({
      raw: makeBadge({ label: "Runs", color: "green", message: "2" }),
      outdated: true,
    });

    expect(postBadgesLog).toEqual(preBadgesLog + 1);
  });

  test("it should return an error if the metric is not defined", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No Client Connection");
    }

    const preBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    const res = await GetBadgeOperation({
      creator: "michmich112",
      name: "action-name",
      metric: "doesNotExist" as BadgeMetrics,
    });

    client = (await PostgresConnectedClient()) as Client;
    const postBadgesLog = (await client.query('SELECT * FROM "BadgeViews"'))
      .rowCount;

    expect(res).toHaveProperty("err");
    expect(res).not.toHaveProperty("raw");
    expect(res).not.toHaveProperty("url");
    expect(res).not.toHaveProperty("outdated");
    expect(postBadgesLog).toEqual(preBadgesLog);
  });
});
