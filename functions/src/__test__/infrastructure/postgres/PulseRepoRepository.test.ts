import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationPulseRepoRepository from "../../../infrastructure/postgres/PulseReposRepository";

describe.only("PulseRepoRepositoryTests", () => {
  let client: null | Client = null;
  let repo: null | MigrationPulseRepoRepository = null;

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
      repo = await MigrationPulseRepoRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Action run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query('DELETE FROM "PulseRepos";'); // Drop all values from Actions
      // create placeholder toto action
      await client.query(
        'INSERT INTO "PulseRepos" (id, owner, name, hashed_name, full_name, full_hashed_name) VALUES (1, $1, $2, $3, $4, $5);',
        [
          "toto",
          "toto_repo",
          "repo_hashed",
          "toto/toto_repo",
          "toto/repo_hashed",
        ]
      );
    } catch (e) {
      console.warn(`Error populating PulseRepos: Some tests might fail; ${e}`);
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query('DELETE FROM "PulseRepos";'); // Drop all values from Actions
        await client.end();
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
    }
    return;
  });

  describe("GetFromGithubRepositoryString", () => {
    test("it should fetch the PulseRepo if it already exists", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getFromGithubRepositoryString("toto/toto_repo");
      expect(res.id).toEqual(1);
      expect(res.owner).toEqual("toto");
      expect(res.name).toEqual("toto_repo");
      expect(res.hashed_name).toEqual("repo_hashed");
      expect(res.full_name).toEqual("toto/toto_repo");
      expect(res.full_hashed_name).toEqual("toto/repo_hashed");
    });

    test("it should create a new PulseRepo if it doesn't exist", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getFromGithubRepositoryString("toto/toto_repo2");
      expect(res.id).not.toEqual(1);
      expect(res.owner).toEqual("toto");
      expect(res.name).toEqual("toto_repo2");
      expect(res.hashed_name).not.toEqual("toto_repo2");
      expect(res.full_name).toEqual("toto/toto_repo2");
      expect(res.full_hashed_name).not.toEqual("toto/toto_repo2");
    });

    test("it should handler extra / in repo name", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getFromGithubRepositoryString(
        "toto/toto_repo/the/third"
      );
      expect(res.id).not.toEqual(1);
      expect(res.owner).toEqual("toto");
      expect(res.name).toEqual("toto_repo/the/third");
      expect(res.hashed_name).not.toEqual("toto_repo/the/third");
      expect(res.full_name).toEqual("toto/toto_repo/the/third");
      expect(res.full_hashed_name).not.toEqual("toto/toto_repo/the/third");
    });

    test("it should get the PulseRepo that exists even if the name has an extra / at the end", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const res = await repo.getFromGithubRepositoryString("toto/toto_repo/");
      expect(res.id).toEqual(1);
      expect(res.owner).toEqual("toto");
      expect(res.name).toEqual("toto_repo");
      expect(res.hashed_name).toEqual("repo_hashed");
      expect(res.full_name).toEqual("toto/toto_repo");
      expect(res.full_hashed_name).toEqual("toto/repo_hashed");
    });
  });
});
