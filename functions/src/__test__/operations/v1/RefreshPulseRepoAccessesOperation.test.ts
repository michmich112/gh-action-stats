import { Client } from "pg";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
import { CollectActionRun } from "../../operations/CollectActionRun";
import * as dotenv from "dotenv";
import { createKnownUser } from "../infrastructure/postgres/utils/utils";
import ActionRun from "../../domain/ActionRun.type";
import MigrationUsersPulseRepoAccessesRepository from "../../infrastructure/postgres/UserPulseRepoAccessesRepository";
import { RefreshPulseRepoAccessesOperation } from "../../operations/v1/RefreshPulseRepoAccesses";
import { randomUUID } from "crypto";

const utils = require("../../utils/githubUtils");

async function setup() {
  const run: ActionRun = {
    creator: "michmich112",
    github_action: "action",
    github_actor: "actor",
    github_base_ref: "base",
    github_head_ref: "head",
    github_ref: "ref",
    github_repository: "michmich112/bumpertest",
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

  // create 3 normal runs and 1 attempted run
  await CollectActionRun(run); // use the operation to create the mock data

  await CollectActionRun({
    ...run,
    github_repository: "supabase/supabase",
    timestamp: new Date(123456).toISOString(),
    error: null,
  });
  // this is a attempted Run
  await CollectActionRun({
    ...run,
    github_repository: "michmich112/gh-action-stats",
    timestamp: new Date().toISOString(),
    error: null,
    ip: "1.4.7.78",
  });

  // create new action
  await CollectActionRun({
    ...run,
    github_repository: "private/private-repo",
    creator: "michmich112",
    name: "new-action",
  });
}

async function wipeData(client: Client) {
  const allWiped = await Promise.allSettled([
    client.query('DELETE FROM "Badges";'),
    client.query('DELETE FROM "Runs";'),
    client.query('DELETE FROM "Actions";'),
    client.query('DELETE FROM "RunErrors";'),
    client.query('DELETE FROM "AttemptedRuns";'),
    client.query('DELETE FROM "PulseRepos";'),
    client.query('DELETE FROM "MetricDefinitions";'),
    client.query('DELETE FROM "Users";'),
    client.query('DELETE FROM "UserPulseRepoAccesses";'),
  ]);

  if (allWiped.filter((q) => q.status === "rejected").length > 0)
    throw new Error("Unable to clear some relations");
}

describe("RefreshPulseRepoAccessesOperation Tests", () => {
  let client: Client | null = null;
  let knownUserId: string | null = null;
  let githubToken: string | null = null;

  beforeAll(async function () {
    dotenv.config();
    if (!process.env.TEST_GITHUB_TOKEN) {
      console.error("Missing TEST_GITHUB_TOKEN environment variable");
      throw new Error(
        "Unable to start tests without TEST_GITHUB_TOKEN environment variable set"
      );
    }
    githubToken = process.env.TEST_GITHUB_TOKEN;
    client = await PostgresConnectedClient();
    try {
      await wipeData(client!);
    } catch (e) {
      console.warn("Error Wiping Data", e);
    }

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

    await setup();
    client = await PostgresConnectedClient();

    knownUserId = await createKnownUser(client!, 0, {
      github_username: "michmich112",
    });
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

  test("It should perform a refresh for the user", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No client connection");
    }

    console.time("RefreshPulseRepoAcessesOperation");
    const preOpDate = new Date();

    // Run operation
    await RefreshPulseRepoAccessesOperation({
      userId: knownUserId!,
      userGithubToken: githubToken!,
    });

    console.timeEnd("RefreshPulseRepoAcessesOperation");

    client = await PostgresConnectedClient();
    let userPRaccessRepo = await MigrationUsersPulseRepoAccessesRepository.New(
      client!
    );

    let accesses = await userPRaccessRepo.getAllPulseRepoAccessesForUser(
      knownUserId!
    );
    expect(accesses.length).toEqual(4);
    expect(accesses.filter((a) => a.canAccess).length).toEqual(3);
    expect(
      accesses.filter((a) => a.lastPolled.getTime() > preOpDate.getTime())
        .length
    ).toEqual(4);
  });

  test("It should throw an error if the githubTokenis invalid", async function () {
    if (!client) {
      console.warn("No client connection, failing test.");
      throw new Error("No client connection");
    }

    try {
      // Run operation
      await RefreshPulseRepoAccessesOperation({
        userId: knownUserId!,
        userGithubToken: randomUUID(),
      });
    } catch {
      return;
    }

    throw new Error("Expected an error to be thrown");
  });
});
