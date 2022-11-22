import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationAttemptedRunRepository from "../../../infrastructure/postgres/AttemptedRunRepository";

describe.only("RunErrorRepostiory Test", () => {
  let client: null | Client = null;
  let repo: null | MigrationAttemptedRunRepository = null;
  let known_id: number = 1;

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
      repo = await MigrationAttemptedRunRepository.New(client);
    } catch (e) {
      console.warn(`Error creating AttemptedRuns run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query('DELETE FROM "AttemptedRuns";'); // Drop all values from Actions
      // create placeholder
      const res = await client.query(
        'INSERT INTO "AttemptedRuns" (reason) VALUES ($1) RETURNING id;',
        ["BadIP"]
      );
      if (res.rowCount < 1) {
        throw new Error("No id returned from know attempted run");
      }
      known_id = parseInt(res.rows[0].id);
    } catch (e) {
      console.warn(
        `Error populating AttemptedRuns: Some tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "AttemptedRuns";'); // Drop all values from Actions
        await client.end();
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
    }
  });

  describe("Create", () => {
    test("it should create a new AttemptedRun if it does not exists yet.", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const ar = await repo.create({ reason: "Over The Rate Limit" });
      expect(ar).not.toBeNaN();
      expect(ar).not.toEqual(known_id);
    });
    test("it should return an existing Attepted run if it already exists.", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const ar = await repo.create({ reason: "BadIP" });
      expect(ar).not.toBeNaN();
      expect(ar).toEqual(known_id);
    });
    test("it should return an error if the reason is not passed.", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.create({ reason: "" });
        fail("Expected error to be thrown");
      } catch (e: any) {
        expect(e.message).toEqual(
          "Cannot create attempt, must have valid reason."
        );
      }
    });
  });

  describe("GetById", () => {
    test("it should return the existing AttemptedRun if it exists", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const ar = await repo.getById(known_id);
      expect(ar.id).toEqual(known_id);
      expect(ar.reason).toEqual("BadIP");
    });

    test("it should return an error if the id doesn't exist on the db", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      try {
        await repo.getById(69420);
        fail("Expected error to be thown");
      } catch (e: any) {
        expect(e.message).toEqual("AttemptedRun with id 69420 not found.");
      }
    });
  });
});
