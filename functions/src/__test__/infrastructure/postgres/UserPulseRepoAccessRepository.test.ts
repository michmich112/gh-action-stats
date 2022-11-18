import { randomUUID } from "crypto";
import * as dotenv from "dotenv";
import { Client } from "pg";
import { UserPulseRepoAccess } from "../../../domain/UserPulseRepoAccess.type";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationPulseRepoRepository from "../../../infrastructure/postgres/PulseReposRepository";
import MigrationUsersPulseRepoAccessesRepository from "../../../infrastructure/postgres/UserPulseRepoAccessesRepository";
import MigrationUsersRepository from "../../../infrastructure/postgres/UsersRepository";
import {
  createKnownPulseRepo,
  createKnownUser,
  createKnownUserPulseRepoAccessRule,
  skipTest,
  wipeData,
} from "./utils/utils";

const eut = "UserPulseRepoAccessRepository";

describe.only("UserPulseRepoAccessRepository Tests", () => {
  let client: null | Client = null;
  let repo: null | MigrationUsersPulseRepoAccessesRepository = null;
  let knownPulseRepoId: null | number = null;
  let knownPulseRepoIdTwo: null | number = null;
  let knownUserId: null | string = null;
  let knownUserPulseRepoAccessRule: null | UserPulseRepoAccess = null;

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
      await MigrationUsersRepository.New(client);
      await MigrationPulseRepoRepository.New(client);
      repo = await MigrationUsersPulseRepoAccessesRepository.New(client);
    } catch (e) {
      console.warn(
        `Error creating UserPulseRepoAccessesRepository run repo: ${e}`
      );
      repo = null;
      return;
    }
    // populate db
    try {
      await wipeData(client, ["UserPulseRepoAccesses", "Users", "PulseRepos"]);
      // await client.query('DELETE FROM "UserPulseRepoAccesses;'); //Drop all values from User Pulse Repo accesses
      // await client.query('DELETE FROM "Users";'); // Drop all values from  users
      // await client.query('DELETE FROM "PulseRepos";'); // Drop all values from Actions

      // create placeholder pulse repo
      knownPulseRepoId = await createKnownPulseRepo(client, {
        owner: "toto",
        name: "toto_repo",
        fullname: "toto/toto_repo",
      });
      knownPulseRepoIdTwo = await createKnownPulseRepo(client, {
        owner: "tata",
        name: "tata_repo",
        fullname: "tata/tata_repo",
      });
      knownUserId = await createKnownUser(client);
      knownUserPulseRepoAccessRule = await createKnownUserPulseRepoAccessRule(
        client,
        {
          userId: knownUserId,
          pulseRepoId: knownPulseRepoId,
          canAccess: true,
          lastPolled: new Date(),
        }
      );
    } catch (e) {
      console.warn(
        `Error populating database for tests: Some tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await wipeData(client, [
          "UserPulseRepoAccesses",
          "Users",
          "PulseRepos",
        ]);
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }

      await client.end();
    }
    return;
  });

  describe("userPulseReposAccessRuleExists", () => {
    test("it should return true if the user pulse repo access rule exists", async function () {
      skipTest(client, repo, eut);

      const { userId, pulseRepoId } =
        knownUserPulseRepoAccessRule as UserPulseRepoAccess;
      const res = await repo!.userPulseRepoAccessRuleExists(
        userId,
        pulseRepoId
      );
      expect(res).toEqual(true);
    });
    test("it should return false if the user pulse repo access rule does not exist due to inexistant user", async function () {
      skipTest(client, repo, eut);
      const res = await repo!.userPulseRepoAccessRuleExists(
        randomUUID(),
        knownPulseRepoId as number
      );
      expect(res).toEqual(false);
    });
    test("it should return false if the user pulse repo access rule does not exist due to inexistant pulseRepo", async function () {
      skipTest(client, repo, eut);
      const res = await repo!.userPulseRepoAccessRuleExists(
        knownUserId as string,
        13412352
      );
      expect(res).toEqual(false);
    });
  });
  describe("createPulseRepoAccessRule", () => {
    test("It should create a new Pulse repo if it does not already exists", async function () {
      skipTest(client, repo, eut);
      const startExists = await repo!.userPulseRepoAccessRuleExists(
        knownUserId as string,
        knownPulseRepoIdTwo as number
      );
      const newPulseRepoAccess: UserPulseRepoAccess = {
        userId: knownUserId as string,
        pulseRepoId: knownPulseRepoIdTwo as number,
        canAccess: true,
        lastPolled: new Date(),
      };
      await repo!.createPulseRepoAccessRule(newPulseRepoAccess);
      const endExists = await repo!.userPulseRepoAccessRuleExists(
        knownUserId as string,
        knownPulseRepoIdTwo as number
      );
      expect(startExists).toEqual(false);
      expect(endExists).toEqual(true);
      const persistedPulseRepoId = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoIdTwo as number
      );
      expect(persistedPulseRepoId).toEqual(newPulseRepoAccess);

      // cleanup
      // await client!.query('DELETE FROM "UserPulseRepoAccesses" WHERE user_id = $1 AND pulse_repo_id = $2;', [knownUserId, knownPulseRepoIdTwo]);
    });

    test.todo(
      "Its should perform an update if the UserPulseReposAccessRule already exists"
    );

    test("It should throw an error if the user does not exist", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.createPulseRepoAccessRule({
          userId: randomUUID(),
          pulseRepoId: knownPulseRepoId as number,
          canAccess: true,
        });
      } catch (e) {
        return;
      }
      throw new Error("Expected error to be thrown");
    });

    test("It should throw an error if the pulseRepo does not exist", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.createPulseRepoAccessRule({
          userId: knownUserId as string,
          pulseRepoId: 12341235,
          canAccess: true,
        });
      } catch (e) {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
  });

  describe("updateCanAccessPulseRepoAccessRule", () => {
    test.todo(
      "It should update the the can access field and the polled time if the UserPulseRepoAccessRule Exists"
    );
    test.todo(
      "It should throw an error if the UserPulseRepoAccessRule does not exist"
    );
  });

  describe("updateLastPolledTime", () => {
    test.todo(
      "It should update the last polled time if the UserPulseRepoAccessRule exists"
    );
    test.todo(
      "It should throw an error if the UserPulseRepoAccessRule does not exist"
    );
  });

  describe("getUserPulseRepoAccessRule", () => {
    test.todo(
      "It should retrieve the full UserPulseRepoAccessRule if it exists"
    );
    test.todo(
      "It should throw an error if trying to retrieve a UserPulseRepoAccessRule that does not exist"
    );
  });

  describe("getAllPulseRepoAccessRule", () => {
    test.todo("It should retrieve all UserPulseReposAccessRule for the user");
    test.todo(
      "It should return an empty array if there are no UserPUlseReposAccessRules for user"
    );
    test.todo("It should return an empty array if the user does not exist");
  });

  describe("getAllOutdatedPulseRepoAccessesKeysForUser", () => {
    test.todo(
      "It should retrieve all UserPulseReposAccessRules that are outdated based on the default pollFrequency"
    );
    test.todo(
      "It should retrieve all UserPulseReposAccessRules that are outdated based on a custom pollFrequency"
    );
    test.todo(
      "It should return an empty array if there are no outdate UserPulseReposAccessRules"
    );
    test.todo("It should return an empty array if the user does not exist");
  });
});
