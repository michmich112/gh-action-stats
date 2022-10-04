import ActionRun from "../../../domain/ActionRun.type";
import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationActionRunsRepository from "../../../infrastructure/postgres/MigrationActionRunsRepository";

describe.only("ActionRunRepostoryTests", () => {
  let client: null | Client = null;
  let repo: null | MigrationActionRunsRepository = null;

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
    try {
      repo = await MigrationActionRunsRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Action run repo: ${e}`);
      repo = null;
      return;
    }
    // // populate db
    try {
      // create placeholder toto action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (1, $1, $2, $3);',
        ["toto", "toto_action", new Date(0).toISOString()]
      );

      // create placeholder pusle repo
      await client.query(
        'INSERT INTO "PulseRepos" (id, owner, name, hashed_name, full_name, full_hashed_name) VALUES (1,$1,$2,$3,$4,$5 )',
        ["user", "repository", "1234", "user/repository", "user/1234"]
      );
    } catch (e) {
      console.warn(
        `Error populating Actions or PulseRepos: Tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "Runs";'); // Drop all values from Runs
        await client.query('DELETE FROM "Actions";'); // Drop all values from Actions
        await client.query('DELETE FROM "PulseRepos";'); // Drop all values from Actions
        await client.end();
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
    }
    return;
  });

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
    ip: "1.2.3.4",
    name: "toto_action",
    runner_os: "Linux",
    runner_name: "HostedRunner",
    timestamp: new Date().toISOString(),
    version: "main_branch",
    execution_time: [0, 123456789],
    error: null,
  };

  test("it should return an error if the action id does not exist.", async function () {
    if (client === null || repo === null) {
      console.warn("No client connection or repo, skipping test");
      return;
    }

    const run = {
      actionId: 2,
      pulseRepoId: 1,
      run: ar,
    };
    try {
      await repo.create(run);
      fail("Should return an error");
    } catch (e) {
      // test passes
      return;
    }
  });

  test("it should return an error if the pulse repo id does not exist.", async function () {
    if (client === null || repo === null) {
      console.warn("No client connection or repo, skipping test");
      return;
    }

    const run = {
      actionId: 1,
      pulseRepoId: 2,
      run: ar,
    };
    try {
      await repo.create(run);
      fail("Should return an error");
    } catch (e) {
      // test passes
      return;
    }
  });

  test("it should return an error if the error_id does not exist.", async function () {
    if (client === null || repo === null) {
      console.warn("No client connection or repo, skipping test");
      return;
    }

    const run = {
      actionId: 1,
      pulseRepoId: 1,
      errorId: 1, // no error records were created
      run: ar,
    };
    try {
      await repo.create(run);
      fail("Should return an error");
    } catch (e) {
      // test passes
      return;
    }
  });

  test("it should insert the contents if all values are correct.", async function () {
    if (client === null || repo === null) {
      console.warn("No client connection or repo, skipping test");
      return;
    }

    const run = {
      actionId: 1,
      pulseRepoId: 1,
      run: ar,
    };

    const id = await repo.create(run);
    expect(id).not.toBeNaN();
  });
});
