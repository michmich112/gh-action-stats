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
  let knownUserIdTwo: null | string = null;
  // let knownUserPulseRepoAccessRule: null | UserPulseRepoAccess = null;

  // Setup
  beforeAll(async () => {
    console.time("setup");
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
      /* knownUserId = */ await createKnownUser(client, 0)
        .then((v) => (knownUserId = v))
        .catch(console.warn);
      /* knownUserIdTwo = */ await createKnownUser(client, 1)
        .then((v) => (knownUserIdTwo = v))
        .catch(console.warn);
      await createKnownUserPulseRepoAccessRule(client, {
        userId: knownUserId!,
        pulseRepoId: knownPulseRepoId,
        canAccess: true,
        lastPolled: new Date(),
      }).catch(console.warn);
    } catch (e) {
      console.warn(
        `Error populating database for tests: Some tests might fail; ${e}`
      );
    } finally {
      console.timeEnd("setup");
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

      const res = await repo!.userPulseRepoAccessRuleExists(
        knownUserId!,
        knownPulseRepoId!
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
      const persistedPulseRepo = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoIdTwo as number
      );
      expect(persistedPulseRepo.lastPolled.getTime()).toBeGreaterThanOrEqual(
        newPulseRepoAccess.lastPolled.getTime()
      );
      expect(persistedPulseRepo).toEqual({
        ...newPulseRepoAccess,
        lastPolled: persistedPulseRepo.lastPolled,
      });

      // cleanup
      // await client!.query('DELETE FROM "UserPulseRepoAccesses" WHERE user_id = $1 AND pulse_repo_id = $2;', [knownUserId, knownPulseRepoIdTwo]);
    });

    test("Its should perform an update if the UserPulseReposAccessRule already exists", async function () {
      const prev = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      await repo!.createPulseRepoAccessRule({
        userId: knownUserId as string,
        pulseRepoId: knownPulseRepoId as number,
        canAccess: false,
      });
      const updated = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      expect(updated).not.toEqual(prev);
      expect(updated.canAccess).toEqual(false);
      expect(updated.lastPolled).not.toEqual(prev.lastPolled);
      expect(updated.lastPolled.getTime()).toBeGreaterThan(
        prev.lastPolled.getTime()
      );
    });

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
    test("It should update the the can access field and the polled time if the UserPulseRepoAccessRule Exists", async function () {
      skipTest(client, repo, eut);
      const prev = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      await repo!.updateCanAccessPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number,
        !prev.canAccess
      );
      const updated = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      expect(updated).not.toEqual(prev);
      expect(updated.canAccess).not.toEqual(prev.canAccess);
      expect(updated.lastPolled).not.toEqual(prev.lastPolled);
      expect(updated.lastPolled.getTime()).toBeGreaterThan(
        prev.lastPolled.getTime()
      );
    });
    test("It should throw an error if the UserPulseRepoAccessRule does not exist (user and pulse repo exist, no rule)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateCanAccessPulseRepoAccessRule(
          knownUserIdTwo!,
          knownPulseRepoId!,
          true
        );
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });

    test("It should throw an error if the UserPulseRepoAccessRule does not exist (user doesn't exist)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateCanAccessPulseRepoAccessRule(
          randomUUID(),
          knownPulseRepoId as number,
          true
        );
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
    test("It should throw an error if the UserPulseRepoAccessRule does not exist (pulseRepoId doesn't exist)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateCanAccessPulseRepoAccessRule(
          knownUserId as string,
          1233423152341,
          true
        );
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
  });

  describe("updateLastPolledTime", () => {
    test("It should update the last polled time if the UserPulseRepoAccessRule exists", async function () {
      skipTest(client, repo, eut);
      const prev = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      await repo!.updateLastPolledTime(
        knownUserId as string,
        knownPulseRepoId as number
      );
      const updated = await repo!.getUserPulseRepoAccessRule(
        knownUserId as string,
        knownPulseRepoId as number
      );
      expect(updated).not.toEqual(prev);
      expect(updated.canAccess).toEqual(prev.canAccess);
      expect(updated.lastPolled).not.toEqual(prev.lastPolled);
      expect(updated.lastPolled.getTime()).toBeGreaterThan(
        prev.lastPolled.getTime()
      );
    });
    test("It should throw an error if the UserPulseRepoAccessRule does not exist (user and pulser repo exist, no rule)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateLastPolledTime(knownUserIdTwo!, knownPulseRepoIdTwo!);
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
    test("It should throw an error if the UserPulseRepoAccessRule does not exist (user doesn't exist)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateLastPolledTime(
          randomUUID(),
          knownPulseRepoId as number
        );
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
    test("It should throw an error if the UserPulseRepoAccessRule does not exist (pulse repo doesn't exists)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.updateLastPolledTime(knownUserId as string, 213412306);
      } catch {
        return;
      }
      throw new Error("Expected error to be thrown");
    });
  });

  describe("getUserPulseRepoAccessRule", () => {
    test("It should retrieve the full UserPulseRepoAccessRule if it exists", async function () {
      skipTest(client, repo, eut);
      const upra = await repo!.getUserPulseRepoAccessRule(
        knownUserId!,
        knownPulseRepoId!
      );
      expect(upra.userId).toEqual(knownUserId!);
      expect(upra.pulseRepoId).toEqual(knownPulseRepoId!);
      expect([true, false].includes(upra.canAccess)).toBe(true);
      expect(upra.lastPolled.getTime()).toBeGreaterThan(
        new Date().getTime() - 600000
      );
    });
    test("It should throw an error if trying to retrieve a UserPulseRepoAccessRule that does not exist (user and pulse repo exist, no rule)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.getUserPulseRepoAccessRule(
          knownUserIdTwo!,
          knownPulseRepoIdTwo!
        );
      } catch {
        return;
      }
      throw new Error("epected error to be thrown");
    });
    test("It should throw an error if trying to retrieve a UserPulseRepoAccessRule that does not exist (user does not exist)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.getUserPulseRepoAccessRule(randomUUID(), knownPulseRepoId!);
      } catch {
        return;
      }
      throw new Error("epected error to be thrown");
    });
    test("It should throw an error if trying to retrieve a UserPulseRepoAccessRule that does not exist (pulse repo)", async function () {
      skipTest(client, repo, eut);
      try {
        await repo!.getUserPulseRepoAccessRule(knownUserId!, 1234281704);
      } catch {
        return;
      }
      throw new Error("epected error to be thrown");
    });
  });

  describe("getAllPulseRepoAccessesForUser", () => {
    test("It should retrieve all UserPulseReposAccessRule for the user", async function () {
      skipTest(client, repo, eut);
      const accesses = await repo!.getAllPulseRepoAccessesForUser(knownUserId!);
      expect(accesses.length).toEqual(2);
      expect(accesses.map((a) => a.pulseRepoId)).toContain(knownPulseRepoId);
      expect(accesses.map((a) => a.pulseRepoId)).toContain(knownPulseRepoIdTwo);
    });
    test("It should return an empty array if there are no UserPUlseReposAccessRules for user", async function () {
      skipTest(client, repo, eut);
      const accesses = await repo!.getAllPulseRepoAccessesForUser(
        knownUserIdTwo!
      );
      expect(accesses).toEqual([]);
    });
    test("It should return an empty array if the user does not exist", async function () {
      skipTest(client, repo, eut);
      const accesses = await repo!.getAllPulseRepoAccessesForUser(randomUUID());
      expect(accesses).toEqual([]);
    });
  });

  describe("getAllOutdatedPulseRepoAccessesKeysForUser", () => {
    test("It should retrieve all UserPulseReposAccessRules that are outdated based on the default pollFrequency", async function () {
      skipTest(client, repo, eut);
      // Update known pulse repo to be outdated
      await client!.query(
        'UPDATE "UserPulseRepoAccesses" SET last_polled = $3 WHERE user_id = $1 AND pulse_repo_id = $2;',
        [
          knownUserId!,
          knownPulseRepoId!,
          new Date(new Date().getTime() - (24 * 60 * 60 + 30) * 1000), // 1 day and 30 seconds
        ]
      );

      const outdated = await repo!.getAllOutdatedPulseRepoAccessesKeysForUser(
        knownUserId!
      );
      expect(outdated.length).toEqual(1);
      expect(outdated[0].pulseRepoId).toEqual(knownPulseRepoId!);
      // Cleanup
      await repo!.updateLastPolledTime(knownUserId!, knownPulseRepoId!);
    });
    test("It should retrieve all UserPulseReposAccessRules that are outdated based on a custom pollFrequency", async function () {
      skipTest(client, repo, eut);
      await repo!.updateLastPolledTime(knownUserId!, knownPulseRepoId!); // update the time of this one so it doesn't pop up with a low poll freq
      // Update known pulse repo to be outdated
      await client!.query(
        'UPDATE "UserPulseRepoAccesses" SET last_polled = $3 WHERE user_id = $1 AND pulse_repo_id = $2;',
        [
          knownUserId!,
          knownPulseRepoIdTwo!,
          new Date(new Date().getTime() - 10000), // 10 seconds
        ]
      );

      const outdated = await repo!.getAllOutdatedPulseRepoAccessesKeysForUser(
        knownUserId!,
        3
      );
      expect(outdated.length).toEqual(1);
      expect(outdated[0].pulseRepoId).toEqual(knownPulseRepoIdTwo!);
      // Cleanup
      await repo!.updateLastPolledTime(knownUserId!, knownPulseRepoIdTwo!);
    });
    test("It should return an empty array if there are no outdate UserPulseReposAccessRules", async function () {
      skipTest(client, repo, eut);
      const outdated = await repo!.getAllOutdatedPulseRepoAccessesKeysForUser(
        knownUserId!
      );
      expect(outdated).toEqual([]);
    });
    test("It should return an empty array if the user does not exist", async function () {
      skipTest(client, repo, eut);
      const outdated = await repo!.getAllOutdatedPulseRepoAccessesKeysForUser(
        randomUUID()
      );
      expect(outdated).toEqual([]);
    });
  });

  describe("revertAllPulseRepoAccessesForUser", () => {
    test("It should set all can_access values to false", async function () {
      skipTest(client, repo, eut);
      await repo!.updateCanAccessPulseRepoAccessRule(
        knownUserId!,
        knownPulseRepoId!,
        true
      );
      await repo!.updateCanAccessPulseRepoAccessRule(
        knownUserId!,
        knownPulseRepoIdTwo!,
        true
      );
      const pre = await repo!.getAllPulseRepoAccessesForUser(knownUserId!);

      await repo!.revertAllPulseRepoAccessesForUser(knownUserId!);

      const post = await repo!.getAllPulseRepoAccessesForUser(knownUserId!);
      expect(pre.map((p) => p.canAccess)).toEqual([true, true]);
      expect(post.map((p) => p.canAccess)).toEqual([false, false]);
      expect(
        Math.max(...post.map((p) => p.lastPolled.getTime()))
      ).toBeGreaterThan(Math.max(...pre.map((p) => p.lastPolled.getTime())));
    });
    test("It should not throw an error if there are no PuleRepoAccessRules for the user", async function () {
      skipTest(client, repo, eut);
      await repo!.revertAllPulseRepoAccessesForUser(knownUserIdTwo!);
      // no error thrown, we are good
    });
    test("It should not throw an error if the user does not exist", async function () {
      skipTest(client, repo, eut);
      await repo!.revertAllPulseRepoAccessesForUser(randomUUID());
      // no error thrown, we are good
    });
  });
});
