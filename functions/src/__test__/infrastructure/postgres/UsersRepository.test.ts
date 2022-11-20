import { randomUUID } from "crypto";
import * as dotenv from "dotenv";
import { Client } from "pg";
import { MigrationUser } from "../../../domain/User.type";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationUsersRepository from "../../../infrastructure/postgres/UsersRepository";
import { createKnownUser } from "./utils/utils";

const eut = "UsersRepository";

function skip(client: any, repo: any, soft: boolean = false): boolean {
  if (!client || !repo) {
    if (soft) {
      console.warn(`[${eut}] - client or repo not initialized. Skipping tests`);
      return false;
    }
    throw new Error(
      `[${eut}] - client or repo not initialized. Cancelling tests`
    );
  }
  return true;
}

describe.only(`${eut}Tests`, () => {
  let client: null | Client = null;
  let repo: null | MigrationUsersRepository = null;
  let knownSupabaseUserId: null | string = null;

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

    const supbaseUserTableExists = await client.query(
      "SELECT EXISTS(SELECT FROM pg_tables WHERE schemaname = 'auth' and tablename = 'users');"
    );

    if (!supbaseUserTableExists.rows[0].exists) {
      console.error(`Supabase user table "auth"."users" does not exist`);
      throw new Error("Invalid DB state or accesses");
    }

    try {
      repo = await MigrationUsersRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Users repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query('DELETE FROM "Users";'); // Drop all values from Users
      knownSupabaseUserId = await createKnownUser(client);
    } catch (e) {
      console.warn(`Error populating Users: Some tests might fail; ${e}`);
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "Users";'); // Drop all values from Users
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
      await client.end();
    }
    return;
  });

  describe("GetUser", () => {
    describe("getUserById", () => {
      test("it should return user if it exists", async function () {
        skip(client, repo);
        if (!knownSupabaseUserId) {
          throw new Error("[GetUser][getUserById] - No Known Supabase User Id");
        }
        const user = await repo!.getUserById(knownSupabaseUserId);
        expect(user.id).toEqual(knownSupabaseUserId);
        expect(user.githubUsername).toEqual("known_username");
        expect(user.githubId).toEqual(12345);
        expect(user.avatarUrl).toBeUndefined();
      });

      test("it should throw an error if user with id does not exist", async function () {
        skip(client, repo);
        try {
          await repo!.getUserById(randomUUID());
        } catch (e) {
          return;
        }
        throw new Error("Expected error to be thrown");
      });
    });
    describe("getUserByGithubUsername", () => {
      test("it should return if it exists", async function () {
        skip(client, repo);
        const user = await repo!.getUserByGithubUsername("known_username");
        expect(user.id).toEqual(knownSupabaseUserId);
        expect(user.githubUsername).toEqual("known_username");
        expect(user.githubId).toEqual(12345);
        expect(user.avatarUrl).toBeUndefined();
      });
      test("it should throw an errir if user with username does not exist", async function () {
        skip(client, repo);
        try {
          await repo!.getUserByGithubUsername("does_not_exist");
        } catch (e) {
          return;
        }
        throw new Error("Expected error to be thrown");
      });
    });
    describe("getUserByGithubId", () => {
      test("it should return if it exists", async function () {
        skip(client, repo);
        const user = await repo!.getUserByGithubId(12345);
        expect(user.id).toEqual(knownSupabaseUserId);
        expect(user.githubUsername).toEqual("known_username");
        expect(user.githubId).toEqual(12345);
        expect(user.avatarUrl).toBeUndefined();
      });
      test("it should throw an errir if user with username does not exist", async function () {
        skip(client, repo);
        try {
          await repo!.getUserByGithubId(1111111);
        } catch (e) {
          return;
        }
        throw new Error("Expected error to be thrown");
      });
    });
  });

  describe("Update User", () => {
    test("it should update mandatory User fields if it exists", async function () {
      skip(client, repo);
      const startUser = await repo!.getUserById(knownSupabaseUserId as string);
      const updatedUser = {
        ...startUser,
        githubUsername: "second_username",
        githubId: 123456,
        lastRefresh: new Date(),
      } as MigrationUser;
      await repo!.updateUser(updatedUser);
      const endUser = await repo!.getUserById(knownSupabaseUserId as string);
      expect(endUser).toEqual(updatedUser);
    });
    test("it should update optional User fields by setting to value", async function () {
      skip(client, repo);
      const startUser = await repo!.getUserById(knownSupabaseUserId as string);
      const updatedUser = {
        ...startUser,
        avatarUrl: "https://avatar.app/url",
      } as MigrationUser;
      await repo!.updateUser(updatedUser);
      const endUser = await repo!.getUserById(knownSupabaseUserId as string);
      expect(endUser).toEqual(updatedUser);
    });
    test("it should update optional User fields by setting to undefined/null", async function () {
      skip(client, repo);
      const startUser = await repo!.getUserById(knownSupabaseUserId as string);
      const updatedUser = {
        // add all feilds except avatarUrl
        id: startUser.id,
        githubUsername: startUser.githubUsername,
        githubId: startUser.githubId,
        lastRefresh: startUser.lastRefresh,
      } as MigrationUser;
      await repo!.updateUser(updatedUser);
      const endUser = await repo!.getUserById(knownSupabaseUserId as string);
      expect(endUser).toEqual({ ...updatedUser, avatarUrl: undefined }); // having to add undefined since the field is not present
    });
  });
});
