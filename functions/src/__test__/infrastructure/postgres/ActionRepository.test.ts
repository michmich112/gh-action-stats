import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationActionRepository from "../../../infrastructure/postgres/MigrationActionsRepository";
import { createKnownUser, skipTest } from "./utils/utils";
import MigrationUsersRepository from "../../../infrastructure/postgres/UsersRepository";
import { randomUUID } from "crypto";

const eut = "ActionsRepository";

describe.only("ActionsRepositoryTests", () => {
  let client: null | Client = null;
  let repo: null | MigrationActionRepository = null;
  let knownUserId: null | string = null;
  let knownUserIdTwo: null | string = null;

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
      repo = await MigrationActionRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Action run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await MigrationUsersRepository.New(client);

      await client.query('DELETE FROM "Actions";'); // Drop all values from Actions
      await client.query('DELETE FROM "Users";'); // Drop all values from Actions

      // create placeholder toto action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (1, $1, $2, $3);',
        ["toto", "toto_action", new Date(0).toISOString()]
      );

      knownUserId = await createKnownUser(client, 0, {
        github_username: "toto",
      });

      knownUserIdTwo = await createKnownUser(client, 1, {
        github_username: "titi",
      });
    } catch (e) {
      console.warn(`Error populating Actions: Some tests might fail; ${e}`);
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "Actions";'); // Drop all values from Actions
        await client.query('DELETE FROM "Users";'); // Drop all values from Actions
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
      await client.end();
    }
    return;
  });

  describe("Upsert", () => {
    test("it should created if it doesn't exist", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const ts = new Date();
      const res = await repo.upsert({
        creator: "tata",
        name: "tata_actions",
        timestamp: ts.toISOString(),
      });
      expect(res.id).not.toBeNaN();
      expect(res.last_update.getTime()).toEqual(ts.getTime());
    });

    test("it should update the timestamp if it does exists", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const ts = new Date();
      const res = await repo.upsert({
        creator: "toto",
        name: "toto_action",
        timestamp: ts.toISOString(),
      });

      expect(res.id).not.toBeNaN();
      expect(res.id).toEqual(1);
      expect(res.last_update.getTime()).toEqual(ts.getTime());
    });
  });

  describe("GetById", () => {
    test("it should return all data", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getById(1);
      expect(res.id).toEqual(1);
      expect(res.name).toEqual("toto_action");
      expect(res.creator).toEqual("toto");
    });

    test("its should return an error if there is no action with id", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.getById(308);
        fail("Expected error to be thrown");
      } catch (e) {
        // pass;
        return;
      }
    });
  });
  describe("GetByCreatorAndName", () => {
    test("it should return all data", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getByCreatorAndName("toto", "toto_action");
      expect(res.name).toEqual("toto_action");
      expect(res.creator).toEqual("toto");
    });

    test("its should return an error if there is no action with non existant creator and existant name", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.getByCreatorAndName("not_there", "toto_action");
        fail("Expected error to be thrown");
      } catch (e) {
        // pass;
        return;
      }
    });

    test("its should return an error if there is no action with existant creator and non existant name", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.getByCreatorAndName("toto", "dontExists");
        fail("Expected error to be thrown");
      } catch (e) {
        // pass;
        return;
      }
    });

    test("its should return an error if there is no action with non existant creator and non existant name", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.getByCreatorAndName("not_there", "dontExists");
        fail("Expected error to be thrown");
      } catch (e) {
        // pass;
        return;
      }
    });
  });

  describe("getAllActionsWhereUserIsCreator", () => {
    test("It should return all the actions where the user is the owner", async function () {
      skipTest(client, repo, eut);
      const repos = await repo!.getAllActionsWhereUserIsCreator(knownUserId!);
      expect(repos.length).toEqual(1);
      expect(repos[0].name).toEqual("toto_action");
    });
    test("it should return an empty array if there are no actions owned by user", async function () {
      skipTest(client, repo, eut);
      const repos = await repo!.getAllActionsWhereUserIsCreator(
        knownUserIdTwo!
      );
      expect(repos.length).toEqual(0);
    });
    test("it should return an empty array if the user does not exist", async function () {
      skipTest(client, repo, eut);
      const repos = await repo!.getAllActionsWhereUserIsCreator(randomUUID());
      expect(repos.length).toEqual(0);
    });
  });
});
