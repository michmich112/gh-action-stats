import { Client } from "pg";

import { IPostgresRepostiory } from "../../domain/IRepository";
import BadgeView, { UtmParameters } from "../../domain/BadgeView.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "UtmParameters" (
  "id" BIGSERIAL PRIMARY KEY,
  "source" text,
  "medium" text,
  "campaign" text,
  "term" text,
  "content" text,
  UNIQUE ("source", "medium", "campaign", "term", "content")
);

CREATE TABLE IF NOT EXISTS "BadgeViews" (
  "id" BIGSERIAL PRIMARY KEY,
  "badge_id" bigint NOT NULL REFERENCES "Badges" ("id") ON DELETE CASCADE,
  "utm_param_id" bigint NOT NULL REFERENCES "UtmParameters" ("id") ON DELETE SET NULL,
  "timestamp" timestamptz
);
`;

const tableConstraints: string = `
CREATE UNIQUE INDEX IF NOT EXISTS utm_unique_null ON "UtmParameters" ((source IS null), (medium IS NULL), (campaign IS NULL), (term IS NULL), (content IS NULL)) WHERE source IS NULL AND medium is NULL AND campaign is NULL AND term is NULL AND content is NULL;
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
    await this.client.query(tableConstraints);
  }

  /**
   * Gets an Id for persisted UTM params. if they do not exist in the DB they are created and persited.
   */
  private async getUtmId(utm: UtmParameters): Promise<number> {
    function* queryParamIndex() {
      let index = 1;
      while (true) {
        yield index++;
      }
    }
    const paramIndex = queryParamIndex();
    const nullish = [null, undefined];
    const query = `
      SELECT id FROM "${this.utmTableName}" WHERE 1=1
        AND source ${
          nullish.includes(utm.source as null | undefined)
            ? "is NULL"
            : "= $" + paramIndex.next().value!.toString()
        } 
        AND medium ${
          nullish.includes(utm.medium as null | undefined)
            ? "is NULL"
            : "= $" + paramIndex.next().value!.toString()
        }
        AND campaign ${
          nullish.includes(utm.campaign as null | undefined)
            ? "is NULL"
            : "= $" + paramIndex.next().value!.toString()
        }
        AND term ${
          nullish.includes(utm.term as null | undefined)
            ? "is NULL"
            : "= $" + paramIndex.next().value!.toString()
        }
        AND content ${
          nullish.includes(utm.content as null | undefined)
            ? "is NULL"
            : "= $" + paramIndex.next().value!.toString()
        };
    `;
    console.log("Query", query);
    console.log("utm", utm);
    let res;
    try {
      res = await this.client.query(
        query,
        [utm.source, utm.medium, utm.campaign, utm.term, utm.content].filter(
          (f) => !nullish.includes(f as any)
        )
      );
    } catch (e) {
      console.error(
        "[BadgeViewsRepository][getUtmId] Error - Error querying for utm with params:",
        utm,
        "\nError",
        e
      );
    }
    if (!res || res.rowCount < 1) {
      return await this.createNewUtm(utm);
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
      utmId = await this.getUtmId(bv.utmParameters);
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
        utmId,
        "\nError: ",
        e
      );
      throw e;
    }
  }
}
