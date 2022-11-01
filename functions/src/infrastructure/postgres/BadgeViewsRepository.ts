import { Client } from "pg";

import { IPostgresRepostiory } from "../../domain/IRepository";
import BadgeView, { UtmParameters } from "../../domain/BadgeView.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "BadgeViews" (
  "id" BIGSERIAL PRIMARY KEY,
  "badge_id" bigint NOT NULL REFERENCES "Badges" ("id") ON DELETE CASCADE,
  "utm_param_id" bigint NOT NULL REFERENCES "UtmParameters" ("id") ON DELETE SET NULL,
  "timestamp" timestamptz,
);

CREATE TABLE IF NOT EXISTS "UtmParameters" (
  "id" BIGSERIAL PRIMARY KEY,
  "source" text,
  "medium" text,
  "campaign" text,
  "term" text,
  "content" text,
  UNIQUE("source", "medium", "campaign", "term", "content")
);
`;

export default class MigrationBadgeViewsRepository
  implements IPostgresRepostiory
{
  private badgesTableName: string;
  private utmTableName: string;
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.badgesTableName = "BadgeViews";
    this.utmTableName = "UtmParameters";
    this.tableName = this.badgesTableName;
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationBadgeViewsRepository> {
    const i = new MigrationBadgeViewsRepository(client);
    await i.mustExec();
    return i;
  }

  /**
   * Any queries that must execute successfully for us to start using the DB
   * Generally used to create the table if it doesn't exist or run migrations on the schema if needed.
   */
  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
  }

  /**
   * Gets an Id for persisted UTM params. if they do not exist in the DB they are created and persited.
   */
  private async getUtmId(utm: UtmParameters): Promise<number> {
    const query = `
      SELECT id FROM "${this.utmTableName}" WHERE 1=1
        AND source = $1
        AND medium = $2
        AND campaign = $3
        AND term = $4
        AND content = $5;
    `;
    let res;
    try {
      res = await this.client.query(query, [
        utm.source,
        utm.medium,
        utm.campaign,
        utm.term,
        utm.content,
      ]);
    } catch (e) {
      console.error(
        "[BadgeViewsRepository][getUtmId] Error - Error querying for utm with params:",
        utm,
        "\nError",
        e
      );
    }
    if (!res || res.rowCount < 1) {
      return this.createNewUtm(utm);
    } else {
      return parseInt(res.rows[0].id);
    }
  }

  /**
   * Creates a new UTM params row in the DB, returns the ID of the newly persisted row
   */
  private async createNewUtm(utm: UtmParameters): Promise<number> {
    const query = `
      INSERT INTO "${this.utmTableName}" (
        source,
        medium,
        campaign,
        term,
        content
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const res = await this.client.query(query, [
      utm.source,
      utm.medium,
      utm.campaign,
      utm.term,
      utm.content,
    ]);
    if (res.rowCount < 1) {
      throw new Error(
        `[BadgeViewsRepository][createNewUtm] Error - Unable to create new utm: no return from query`
      );
    }
    return parseInt(res.rows[0].id);
  }

  public async saveBadgeView(bv: BadgeView): Promise<void> {
    let utmId;
    try {
      utmId = this.getUtmId(bv.utmParameters);
    } catch (e) {
      console.error(
        "[BadgeViewsRepository][saveBadgeView] Error - Unable to get utm id for badge view: ",
        bv,
        "\nError: ",
        e
      );
      throw e;
    }

    const query = `
      INSERT INTO "${this.badgesTableName}" (
        badge_id,
        utm_param_id,
        timestamp
      ) VALUES ($1, $2, $3);
    `;

    try {
      await this.client.query(query, [bv.badgeId, utmId, bv.timestamp]);
    } catch (e) {
      console.error(
        "[BadgeViewsRepository][saveBadgeView] Error - Unable to save badge view: ",
        bv,
        " with utm id: ",
        utmId
      );
      throw e;
    }
  }
}
