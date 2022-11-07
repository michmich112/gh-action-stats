import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationActionRepository from "../../../infrastructure/postgres/MigrationActionsRepository";
import MigrationPulseRepoRepository from "../../../infrastructure/postgres/PulseReposRepository";
import MigrationMetricsRepository from "../../../infrastructure/postgres/MetricsRepository";
import MigrationActionRunsRepository from "../../../infrastructure/postgres/MigrationActionRunsRepository";
import ActionRun from "../../../domain/ActionRun.type";

describe.only("BadgesRepository tests", () => {
  let client: null | Client = null;
  let repo: null | MigrationMetricsRepository = null;

  // Setup
  beforeAll(async () => {
    dotenv.config();
    try {
      client = createClient();
      await client.connect();
    } catch (e) {
      console.warn("Unable to connect to client, skipping tests.");
      client = null;
      return;
    }
    let actionRunRepo;
    try {
      await MigrationActionRepository.New(client); // create the action repository
      await MigrationPulseRepoRepository.New(client); // create the pulse repo

      actionRunRepo = await MigrationActionRunsRepository.New(client); // create the Action repository if it doesn't already exist
      repo = await MigrationMetricsRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Badges or Action run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query(`
                         DELETE FROM "Runs";
                         DELETE FROM "Actions";
                         DELETE FROM "PulseRepos";
                         DELETE FROM "MetricDefinitions";
                        `); // Drop all values from tables

      // create placeholder toto action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (1, $1, $2, $3);',
        ["toto", "toto_action", new Date(100)]
      );

      // create placeholder pusle repo
      await client.query(
        'INSERT INTO "PulseRepos" (id, owner, name, hashed_name, full_name, full_hashed_name) VALUES (1,$1,$2,$3,$4,$5 )',
        ["user", "repository", "1234", "user/repository", "user/1234"]
      );
      const ar: ActionRun = {
        creator: "toto",
        github_action: "workflow_step_name",
        github_actor: "actor",
        github_base_ref: "base/ref",
        github_head_ref: "head/ref",
        github_ref: "base/ref",
        github_repository: "user/repository",
        github_run_id: "1234353",
        github_event_name: "push",
        github_action_repository: "michmich112/versionbumper@main",
        package_version: "0.1.0",
        ip: "1.2.3.4",
        name: "toto_action",
        runner_os: "Linux",
        runner_name: "HostedRunner",
        timestamp: new Date().toISOString(),
        version: "main_branch",
        execution_time: [0, 123456789],
        error: null,
      };

      // Create two runs
      await actionRunRepo.create({
        actionId: 1,
        pulseRepoId: 1,
        run: ar,
      });

      await actionRunRepo.create({
        actionId: 1,
        pulseRepoId: 1,
        run: {
          ...ar,
          github_run_id: "11111111",
          timestamp: new Date(1111111).toISOString(),
        },
      });

      // create metric 'runs'
      await client.query(
        `INSERT INTO "MetricDefinitions" (metric, query, parameters, return_column)
        VALUES ($1, $2, $3, $4);`,
        [
          "runs",
          'SELECT count(*) as runs FROM "Runs" WHERE action_id = $1;',
          ["actionId"],
          "runs",
        ]
      );
    } catch (e) {
      console.warn(
        `Error populating known values: Some tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query(`                         
                         DELETE FROM "Runs";
                         DELETE FROM "Actions";
                         DELETE FROM "PulseRepos";
                         DELETE FROM "MetricDefinitions"
                         `); // Drop all values from Badges & Actions
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
      await client.end();
    }
    return;
  });

  describe("metricExists", () => {
    test("it should return true if the metric exists", async function () {
      if (client === null || repo === null) {
        throw new Error("No client connection or repo, skipping test");
      }

      const res = await repo.metricExists("runs");
      expect(res).toBeTruthy();
    });
    test("it should return false if the metric doesn't exist", async function () {
      if (client === null || repo === null) {
        throw new Error("No client connection or repo, skipping test");
      }

      const res = await repo.metricExists("non-existing-metric");
      expect(res).toBeFalsy();
    });
  });

  describe("computeMetric", () => {
    test("it should return the computed value for an existing metric with existing params", async function () {
      if (client === null || repo === null) {
        throw new Error("No client connection or repo, skipping test");
      }

      const res = await repo.computeMetric("runs", { actionId: 1 });
      expect(res).toEqual("2");
    });

    test("it should throw an error if not all parameters are passed for the metric", async function () {
      if (client === null || repo === null) {
        throw new Error("No client connection or repo, skipping test");
      }

      try {
        await repo.computeMetric("runs", {});
      } catch {
        return;
      }
      throw new Error("Expected Error to be thrown");
    });
    test("it should throw an error if choosing a non-existant metric", async function () {
      if (client === null || repo === null) {
        throw new Error("No client connection or repo, skipping test");
      }

      try {
        await repo.computeMetric("non-existing", { actionId: 1 });
      } catch {
        return;
      }
      throw new Error("Expected Error to be thrown");
    });
  });
});
