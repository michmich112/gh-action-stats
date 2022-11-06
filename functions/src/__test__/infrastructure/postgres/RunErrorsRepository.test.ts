import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationRunErrorsRepository from "../../../infrastructure/postgres/RunErrorsRepository";

describe.only("RunErrorRepostiory Test", () => {
  let client: null | Client = null;
  let repo: null | MigrationRunErrorsRepository = null;

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
      repo = await MigrationRunErrorsRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Action run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query('DELETE FROM "RunErrors";'); // Drop all values from Actions
      // create placeholder
      await client.query(
        'INSERT INTO "RunErrors" (id, name, message, stack) VALUES (1, $1, $2, $3);',
        ["Error", "NullPointerException", "StackTrace"]
      );
    } catch (e) {
      console.warn(`Error populating Actions: Some tests might fail; ${e}`);
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "RunErrors";'); // Drop all values from Actions
        await client.end();
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
    }
  });

  describe("Create", () => {
    test("it should create a new RunError", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const resId = await repo.create({
        name: "CreateError",
        message: "Creating Error",
        stack: "createErororStack",
      });
      expect(resId).not.toBeNaN();
      expect(resId).not.toEqual(1);
    });

    test("it should return an existing RunError", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const resId = await repo.create({
        name: "Error",
        message: "NullPointerException",
        stack: "StackTrace",
      });
      expect(resId).not.toBeNaN();
      expect(resId).toEqual(1);
    });

    test("it should error if therer are no parameters present", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.create({});
        fail("Error should have been thrown when no parameters are present");
      } catch (e: any) {
        if (e.message !== "No run error information was present.") {
          fail("Wrong Error returned");
        }
      }
    });
  });

  describe("getById", () => {
    test("it should return an existing RunError", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const re = await repo.getById(1);
      expect(re.id).toEqual(1);
      expect(re.name).toEqual("Error");
      expect(re.message).toEqual("NullPointerException");
      expect(re.stack).toEqual("StackTrace");
    });

    test("it should return an error if the RunError with that Id does not exist", async () => {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.getById(69420);
        fail("Error Should have been thrown.");
      } catch (e: any) {
        if (e.message !== "No RunError with id 69420 found.") {
          fail("Bad error format");
        }
        return;
      }
    });
  });
});
