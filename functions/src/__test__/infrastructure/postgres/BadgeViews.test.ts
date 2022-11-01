import * as dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "../../../infrastructure/postgres/PostgresClient";
import MigrationBadgeViewsRepository from "../../../infrastructure/postgres/BadgeViewsRepository";
import BadgeView from "../../../domain/BadgeView.type";
import MigrationActionRepository from "../../../infrastructure/postgres/MigrationActionsRepository";
import MigrationBadgesRepository from "../../../infrastructure/postgres/BadgesRepository";

describe.only("BadgeViewsRepository tests", () => {
  let client: null | Client = null;
  let repo: null | MigrationBadgeViewsRepository = null;

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
      await MigrationActionRepository.New(client);
      await MigrationBadgesRepository.New(client);
      repo = await MigrationBadgeViewsRepository.New(client); // Create any table if necessary
    } catch (e) {
      console.warn(
        `Error creating Badges, Action or Badges View run repo: ${e}`
      );
      repo = null;
      return;
    }
    // populate db
    try {
      await client.query(`
                         DELETE FROM "Badges";
                         DELETE FROM "BadgeViews";
                         DELETE FROM "UtmParameters";
                         DELETE FROM "Actions";
                        `); // Drop all values from Badges, BadgeViews, UtmParameters and Actions tables

      // create placeholder toto action
      await client.query(
        'INSERT INTO "Actions" (id, creator, name, last_update) VALUES (1, $1, $2, $3);',
        ["toto", "toto_action", new Date(100)]
      );

      // create existing action up to date (repos)
      await client.query(
        'INSERT INTO "Badges" (id, action_id, metric, last_generated, location_path, public_uri, value) VALUES (1, $1, $2, $3, $4, $5, $6);',
        [
          1,
          "repos",
          new Date(110),
          "toto/toto_action/repos",
          "uri://toto/toto_action/repos",
          "69",
        ]
      );

      await client.query(
        'INSERT INTO "UtmParameters" (id, source, medium, campaign, term, content) VALUES (1, $1, $2, $3, $4, $5);',
        [
          "known_source",
          "known_medium",
          "known_campaign",
          "known_term",
          "known_content",
        ]
      );
    } catch (e) {
      console.warn(
        `Error populating Actions or Badges or UtmParameters: Some tests might fail; ${e}`
      );
    }
  });

  // Teardown
  afterAll(async () => {
    if (client !== null) {
      try {
        await client.query(`
                         DELETE FROM "Badges";
                         DELETE FROM "BadgeViews";
                         DELETE FROM "UtmParameters";
                         DELETE FROM "Actions";
                        `); // Drop all values from Badges, BadgeViews, UtmParameters and Actions tables
      } catch (e) {
        console.error(`ERROR Tearing Down: ${e}.`);
      }
      await client.end();
    }
    return;
  });

  describe("saveBadgeView", () => {
    test("it should create a new badge view with existing UtmParameters", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const bv: BadgeView = {
        badgeId: 1,
        timestamp: new Date(),
        utmParameters: {
          source: "known_source",
          medium: "known_medium",
          campaign: "known_campaign",
          term: "known_term",
          content: "known_content",
        },
      };

      const initial = (await client.query('SELECT * FROM "BadgeViews";'))
        .rowCount;
      await repo.saveBadgeView(bv);
      const current = await client.query(
        'SELECT * FROM "BadgeViews" ORDER BY id DESC;'
      );

      expect(current.rowCount).toEqual(initial + 1);
      expect(current.rows[0]).toEqual({
        //this is returning raw db data
        id: current.rows[0].id, // don't need to verify this
        badge_id: bv.badgeId.toString(),
        timestamp: bv.timestamp,
        utm_param_id: "1",
      });
    });

    test("it should create a new badge view with new UtmParameters", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const bv: BadgeView = {
        badgeId: 1,
        timestamp: new Date(),
        utmParameters: {
          source: "new_source",
          medium: "new_medium",
          campaign: "new_campaign",
          term: "new_term",
          content: "new_content",
        },
      };

      const initial = (await client.query('SELECT * FROM "BadgeViews";'))
        .rowCount;
      const initial_utm = (await client.query('SELECT * FROM "UtmParameters";'))
        .rowCount;
      await repo.saveBadgeView(bv);
      const current = await client.query(
        'SELECT * FROM "BadgeViews" ORDER BY id DESC;'
      );
      const current_utm = await client.query(
        'SELECT * FROM "UtmParameters" ORDER BY id DESC;'
      );

      expect(current.rowCount).toEqual(initial + 1);
      expect(current_utm.rowCount).toEqual(initial_utm + 1);

      expect(current.rows[0]).toEqual({
        id: current.rows[0].id, //don't need to verify this
        badge_id: bv.badgeId.toString(),
        timestamp: bv.timestamp,
        utm_param_id: current_utm.rows[0].id, // must have created a new entry
      });
      expect(current_utm.rows[0]).toEqual({
        id: current_utm.rows[0].id, // don't need to verify this
        source: "new_source",
        medium: "new_medium",
        campaign: "new_campaign",
        term: "new_term",
        content: "new_content",
      });
    });

    test("it should create a new badge view with non existing empty utm parameters", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const bv: BadgeView = {
        badgeId: 1,
        timestamp: new Date(),
        utmParameters: {},
      };

      const initial = (await client.query('SELECT * FROM "BadgeViews";'))
        .rowCount;
      const initial_utm = (await client.query('SELECT * FROM "UtmParameters";'))
        .rowCount;
      await repo.saveBadgeView(bv);
      const current = await client.query(
        'SELECT * FROM "BadgeViews" ORDER BY id DESC;'
      );
      const current_utm = await client.query(
        'SELECT * FROM "UtmParameters" ORDER BY id DESC;'
      );

      expect(current.rowCount).toEqual(initial + 1);
      expect(current_utm.rowCount).toEqual(initial_utm + 1);

      expect(current.rows[0]).toEqual({
        id: current.rows[0].id, //don't need to verify this
        badge_id: bv.badgeId.toString(),
        timestamp: bv.timestamp,
        utm_param_id: current_utm.rows[0].id, // must have created a new entry
      });
      expect(current_utm.rows[0]).toEqual({
        id: current_utm.rows[0].id, // don't need to verify this
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
      });
    });

    test("it should return an error if the badge with passed id does not exist", async function () {
      if (client === null || repo === null) {
        console.warn("No client connection or repo, skipping test");
        return;
      }
      const bv: BadgeView = {
        badgeId: 388299013,
        timestamp: new Date(),
        utmParameters: {},
      };

      try {
        await repo.saveBadgeView(bv);
      } catch (e) {
        return;
      }

      throw new Error("Expected Error to be thrown when saving badge view");
    });
  });
});
