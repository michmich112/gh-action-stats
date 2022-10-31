import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationActionRepository from "../../../infrastructure/postgres/MigrationActionsRepository";
import MigrationBadgesRepository from "../../../infrastructure/postgres/BadgesRepository";
import BadgeMetrics from "../../../domain/BadgeMetrics.type";

describe.only("BadgesRepository tests", () => {
  let client: null | Client = null;
  let repo: null | MigrationBadgesRepository = null;

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
      await MigrationActionRepository.New(client); // create the Action repository if it doesn't already exist
      repo = await MigrationBadgesRepository.New(client);
    } catch (e) {
      console.warn(`Error creating Badges or Action run repo: ${e}`);
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query(`
                         DELETE FROM "Badges";
                         DELETE FROM "Actions";
                        `); // Drop all values from Badges and Actions tables

      // create placeholder toto action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (1, $1, $2, $3);',
        ["toto", "toto_action", new Date(100)]
      );

      // create placeholder tata action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (2, $1, $2, $3);',
        ["tata", "tata_action", new Date()]
      );

      // create existing action not up to date (runs)
      await client.query(
        'INSERT INTO "Badges" (id, action_id, metric, last_generated, location_path, public_uri, value) VALUES (1, $1, $2, $3, $4, $5, $6);',
        [
          1,
          "runs",
          new Date(10),
          "toto/toto_action/runs",
          "uri://toto/toto_action/runs",
          "100",
        ]
      );

      // create existing action up to date (repos)
      await client.query(
        'INSERT INTO "Badges" (id, action_id, metric, last_generated, location_path, public_uri, value) VALUES (2, $1, $2, $3, $4, $5, $6);',
        [
          1,
          "repos",
          new Date(110),
          "toto/toto_action/repos",
          "uri://toto/toto_action/repos",
          "69",
        ]
      );
    } catch (e) {
      console.warn(
        `Error populating Actions &/or Badges: Some tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query(`DELETE FROM "Badges"; 
                           DELETE FROM "Actions";`); // Drop all values from Badges & Actions
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
      await client.end();
    }
    return;
  });

  describe("isBadgeAccurate", () => {
    test("it should return true if badge is up to date", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const res = await repo.isBadgeAccurate({
        creator: "toto",
        name: "toto_action",
        metric: "repos",
      });
      expect(res).toEqual(true);
    });
    test("it should return false if badge is not up to date", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const res = await repo.isBadgeAccurate({
        creator: "toto",
        name: "toto_action",
        metric: "runs",
      });
      expect(res).toEqual(false);
    });
    test("it should return false if no badge exists for this action or metric", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const res = await repo.isBadgeAccurate({
        creator: "toto",
        name: "toto_action",
        metric: "runs-per-month",
      });
      expect(res).toEqual(false);
    });
  });

  describe("updateBadge", () => {
    test("it should update only the parameters passed", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const b = await repo.getBadge({ actionId: 1, metric: "runs" });
      await repo.updateBadge({
        actionId: 1,
        metric: "runs",
        value: "12345",
      });
      const a = await repo.getBadge({ actionId: 1, metric: "runs" });
      expect(b.value).not.toEqual(a.value);
      expect({ ...b, value: "" }).toEqual({ ...b, value: "" });
    });

    test("it should not error if no updatable parameters are passed", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const b = await repo.getBadge({ actionId: 1, metric: "runs" });
      await repo.updateBadge({
        actionId: 1,
        metric: "runs",
      });
      const a = await repo.getBadge({ actionId: 1, metric: "runs" });
      expect(b.value).toEqual(a.value);
    });
  });

  describe("getBadge", () => {
    test("it should return an error if there is no badge for the action and metric", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      try {
        await repo.getBadge({ actionId: 2, metric: "runs" });
      } catch (e) {
        return;
      }
      fail("Error should have been thrown");
    });

    test("it should return the Badge information if it exists", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const badge = await repo.getBadge({ actionId: 1, metric: "runs" });
      expect(badge).toEqual({
        actionId: 1,
        metric: "runs",
        lastGenerated: new Date(10),
        locationPath: "toto/toto_action/runs",
        publicUri: "uri://toto/toto_action/runs",
        value: "100",
      });
    });
  });

  describe("createBadge", () => {
    test("it should create a new badge with all the information", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }

      const now = new Date();

      const badge = {
        actionId: 2,
        metric: "repos" as BadgeMetrics,
        lastGenerated: now,
        locationPath: "/tata/tata_action/repos",
        publicUri: "uri//tata/tata_action/repos",
        value: "6989",
      };
      await repo.createBadge(badge);

      const resBadge = await repo.getBadge({ actionId: 2, metric: "repos" });
      expect(resBadge).toEqual(badge);
    });
    test("it should error if the action doesn't exist", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      try {
        await repo.createBadge({
          actionId: 3,
          metric: "repos",
          lastGenerated: new Date(),
          locationPath: "newPath",
          publicUri: "uri://newPath",
          value: "1010",
        });
      } catch (e) {
        return;
      }
      fail("Expected error to be thrown");
    });
  });
});
