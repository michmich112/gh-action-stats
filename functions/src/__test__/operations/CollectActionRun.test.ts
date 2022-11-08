import * as dotenv from "dotenv";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
import ActionRun from "../../domain/ActionRun.type";
import { Client } from "pg";
import { CollectActionRun } from "../../operations/CollectActionRun";

const utils = require("../../utils/githubUtils");

const GetActionRunQuery = `
SELECT 
  a.creator as "creator",
  a.name as "name",
  r.github_action as "github_action",
  r.github_actor as "github_actor",
  r.github_base_ref as "github_base_ref",
  r.github_head_ref as "github_head_ref",
  r.github_ref as "github_ref",
  r.github_repository as "github_repository",
  r.github_event_name as "github_event_name",
  r.github_action_repository as "github_action_repository",
  r.github_run_id as "github_run_id",
  r.ip as "ip",
  r.runner_os as "runner_os",
  r.runner_name as "runner_name",
  r.t as "timestamp",
  r.version as "version",
  r.package_version as "package_version",
  ARRAY[r.execution_time_s::INT, r.execution_time_ns::INT] as "execution_time",
  r.package_version as "package_version",
  coalesce(e.err, null) as "error"
FROM "Runs" r
LEFT JOIN (
  SELECT aa.id,
    aa.creator,
    aa.name
  FROM "Actions" aa
) a on a.id = r.action_id
LEFT JOIN (
  SELECT ee.id,
    to_jsonb(ee.*) - 'id' as "err"
  FROM "RunErrors" ee
  GROUP BY ee.id
) e on e.id = r.error_id
`;

async function wipeData(client: Client) {
  const allWiped = await Promise.allSettled([
    client.query('DELETE FROM "Runs";'),
    client.query('DELETE FROM "Actions";'),
    client.query('DELETE FROM "RunErrors";'),
    client.query('DELETE FROM "AttemptedRuns";'),
    client.query('DELETE FROM "PulseRepos";'),
  ]);

  if (allWiped.filter((q) => q.status === "rejected").length > 0)
    throw new Error("Unable to clear some relations");
}

const MockComsErrorMessage = "Communication Error";

describe("CollectActionRun tests", () => {
  let client: Client | null = null;

  beforeAll(async function () {
    dotenv.config();
    client = await PostgresConnectedClient(); // singleton

    jest
      .spyOn(utils, "isGithubActionsAddress")
      .mockImplementation(async (ip) => {
        if (ip === "9.9.9.9") {
          // mock a communication error
          throw new Error(MockComsErrorMessage);
        }

        const authorizedIps = ["1.2.3.4", "1:2:3:4:5:6:7:8"];
        return authorizedIps.includes(ip as string);
      });
  });

  beforeEach(async function () {
    if (client) {
      try {
        // Drop All existing Data
        await wipeData(client);
      } catch (e) {
        console.warn("Unable to wipe data, some tests might fail");
      }
    }
  });

  afterAll(async function () {
    if (client !== null) {
      try {
        // Cleanup
        await wipeData(client);
      } catch (e) {
        console.error(`Error Tearing Down: ${e}.`);
      }

      await client.end();
    }
  });

  test("it should create all new information if none are preset in the DB", async () => {
    if (!client) {
      console.warn("No client connection, skipping test");
      return;
    }

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

    await CollectActionRun(run);
    client = (await PostgresConnectedClient()) as Client;

    const res = await client.query(GetActionRunQuery);
    expect(res.rowCount).toEqual(1);
    expect({
      ...res.rows[0],
      timestamp: res.rows[0].timestamp.toISOString(),
    }).toEqual(run);

    const attempt = await client.query(`SELECT * FROM "AttemptedRuns";`);
    expect(attempt.rowCount).toEqual(0);
  });

  test("it should create an attempt if it's not from a GitHub IP", async () => {
    if (!client) {
      console.warn("No client connection, skipping test");
      return;
    }

    // Drop All existing Data
    await wipeData(client);

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
      ip: "5.6.7.8",
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

    await CollectActionRun(run);
    client = (await PostgresConnectedClient()) as Client;

    const res = await client.query(GetActionRunQuery);
    expect(res.rowCount).toEqual(1);
    expect({
      ...res.rows[0],
      timestamp: res.rows[0].timestamp.toISOString(),
    }).toEqual(run);

    const attempt = await client.query(`SELECT * FROM "AttemptedRuns";`);
    expect(attempt.rowCount).toEqual(1);
    expect(attempt.rows[0].reason).toEqual(
      "[InvalidIP] - Action Data was sent from a non Github Actions IP: 5.6.7.8."
    );
  });

  test("it should log an attempt if its unable to validate the GitHub IP", async () => {
    if (!client) {
      console.warn("No client connection, skipping test");
      return;
    }

    // Drop All existing Data
    await wipeData(client);

    const ip = "9.9.9.9";
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
      ip: "9.9.9.9",
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

    await CollectActionRun(run);
    client = (await PostgresConnectedClient()) as Client; // required since the  operation will close the connection

    const res = await client.query(GetActionRunQuery);
    expect(res.rowCount).toEqual(1);
    expect({
      ...res.rows[0],
      timestamp: res.rows[0].timestamp.toISOString(),
    }).toEqual(run);

    const attempt = await client.query(`SELECT * FROM "AttemptedRuns";`);
    expect(attempt.rowCount).toEqual(1);
    expect(attempt.rows[0].reason).toEqual(
      `[UnableToGetIP] - Unable to validate IP origin for IP: ${ip}.\nError: ${MockComsErrorMessage}`
    );
  });
});
