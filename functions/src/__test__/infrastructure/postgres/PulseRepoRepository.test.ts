import * as dotenv from "dotenv";
import { Client } from "pg";
import MigrationActionRunsRepository from "../../../infrastructure/postgres/MigrationActionRunsRepository";
import MigrationActionRepository from "../../../infrastructure/postgres/MigrationActionsRepository";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationPulseRepoRepository from "../../../infrastructure/postgres/PulseReposRepository";
import {
  createKnownAction,
  defaultActionRun,
  skipTest,
  wipeData,
} from "./utils/utils";

const eut = "PulseReposRepository";

describe.only("PulseRepoRepositoryTests", () => {
  let client: null | Client = null;
  let repo: null | MigrationPulseRepoRepository = null;
  let knownPulseRepoId: null | number = null;
  let knownPulseRepoIdTwo: null | number = null;
  let knownActionId: null | number = null;
  let knownActionIdTwo: null | number = null;
  let knownActionIdThree: null | number = null;

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
      await wipeData(client, ["Runs", "PulseRepos", "Actions"]);
      // await client.query('DELETE FROM "PulseRepos";'); // Drop all values from Actions
      // create placeholder toto action

      knownPulseRepoId = parseInt(
        (
          await client.query(
            'INSERT INTO "PulseRepos" (owner, name, hashed_name, full_name, full_hashed_name) VALUES ($1, $2, $3, $4, $5) RETURNING id;',
            [
              "toto",
              "toto_repo",
              "repo_hashed",
              "toto/toto_repo",
              "toto/repo_hashed",
            ]
          )
        ).rows[0].id
      );
      knownPulseRepoIdTwo = parseInt(
        (
          await client.query(
            'INSERT INTO "PulseRepos" (owner, name, hashed_name, full_name, full_hashed_name) VALUES ($1, $2, $3, $4, $5) RETURNING id;',
            [
              "tata",
              "tata_repo",
              "repo_hashed",
              "tata/tata_repo",
              "tata/repo_hashed",
            ]
          )
        ).rows[0].id
      );

      await MigrationActionRepository.New(client); // initialize ActionRepository And dependencies
      knownActionId = await createKnownAction(client, {
        creator: "toto",
        name: "toto_action",
      });
      knownActionIdTwo = await createKnownAction(client, {
        creator: "titi",
        name: "titi_action",
      });
      knownActionIdThree = await createKnownAction(client, {
        creator: "pipi",
        name: "pipi_action",
      });

      const runRepo = await MigrationActionRunsRepository.New(client);

      // create 4 runs for 2 pulse repos and 2 Actions
      await runRepo.create({
        actionId: knownActionId,
        pulseRepoId: knownPulseRepoId,
        run: defaultActionRun,
      });
      await runRepo.create({
        actionId: knownActionId,
        pulseRepoId: knownPulseRepoIdTwo,
        run: defaultActionRun,
      });
      await runRepo.create({
        actionId: knownActionId,
        pulseRepoId: knownPulseRepoIdTwo,
        run: defaultActionRun,
      });
      await runRepo.create({
        actionId: knownActionIdTwo,
        pulseRepoId: knownPulseRepoIdTwo,
        run: defaultActionRun,
      });
    } catch (e) {
      console.warn(`Error populating PulseRepos: Some tests might fail; ${e}`);
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await wipeData(client, ["Runs", "PulseRepos", "Actions"]);
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      } finally {
        await client.end();
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
      expect(res.id).toEqual(knownPulseRepoId);
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
      expect(res.id).not.toEqual(knownPulseRepoId);
      expect(res.id).not.toEqual(knownPulseRepoIdTwo);
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
      expect(res.id).not.toEqual(knownPulseRepoId);
      expect(res.id).not.toEqual(knownPulseRepoIdTwo);
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
      expect(res.id).toEqual(knownPulseRepoId);
      expect(res.owner).toEqual("toto");
      expect(res.name).toEqual("toto_repo");
      expect(res.hashed_name).toEqual("repo_hashed");
      expect(res.full_name).toEqual("toto/toto_repo");
      expect(res.full_hashed_name).toEqual("toto/repo_hashed");
    });
  });

  describe("getAllPulseReposForActions", () => {
    test("It should get all the pulse repos for a single action", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([
        knownActionId!,
      ]);
      expect(pulseRepos.length).toEqual(2);

      const pulseReposTwo = await repo!.getAllPulseReposForActions([
        knownActionIdTwo!,
      ]);
      expect(pulseReposTwo.length).toEqual(1);
    });
    test("It should get all the pulse repos for a multiple actions", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([
        knownActionId!,
        knownActionIdTwo!,
      ]);
      expect(pulseRepos.length).toEqual(2);
    });
    test("It should return an empty array if there are no pulse repos for the action ids passed", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([
        knownActionIdThree!,
      ]);
      expect(pulseRepos).toEqual([]);
    });
    test("It should return all the pulse repos for multiple actions even if not all of them have runs", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([
        knownActionId!,
        knownActionIdTwo!,
        knownActionIdThree!,
      ]);
      expect(pulseRepos.length).toEqual(2);
    });
    test("It should return an empty array if no action ids are passed", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([]);
      expect(pulseRepos).toEqual([]);
    });
    test("It should return an empty array if non existing action ids are passed", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([123412348]);
      expect(pulseRepos).toEqual([]);
    });
    test("It should return the correct pulse repos array if existing and non existing action ids are passed", async function () {
      skipTest(client, repo, eut);
      const pulseRepos = await repo!.getAllPulseReposForActions([
        knownActionIdTwo!,
        123412348,
      ]);
      expect(pulseRepos.length).toEqual(1);
    });
  });
});
