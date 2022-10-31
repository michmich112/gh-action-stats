import { Client } from "pg";
import Badge from "../../domain/Badge.type";
import BadgeMetrics from "../../domain/BadgeMetrics.type";

import { IPostgresRepostiory } from "../../domain/IRepository";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Badges" (
  "id" BIGSERIAL PRIMARY KEY,
  "action_id" bigint NOT NULL REFERENCES "Actions" ("id"),
  "metric" text NOT NULL,
  "last_generated" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "location_path" text NOT NULL,
  "public_uri" text NOT NULL,
  "value" text NOT NULL,
  UNIQUE ("action_id", "metric")
);`;

const tableConstraints: string = `
CREATE INDEX IF NOT EXISTS badges_am_idx ON "Badges" ("action_id","metric");
`;

export default class MigrationBadgesRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "Badges";
    this.client = client;
  }

  public static async New(client: Client): Promise<MigrationBadgesRepository> {
    const i = new MigrationBadgesRepository(client);
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

  public async isBadgeAccurate({
    creator,
    name,
    metric,
  }: {
    creator: string;
    name: string;
    metric: BadgeMetrics;
  }): Promise<boolean> {
    const query = `
      SELECT 
        b.last_generated >= a.last_update as "is_accurate"
      FROM "${this.tableName}" b
      LEFT JOIN (
        SELECT
          aa.creator,
          aa.name,
          aa.last_update
          FROM "Actions"
      ) a on a.creator = ? and a.name = ?
      where b.metric = ?;
    `;
    const res = await this.client.query(query, [creator, name, metric]);
    if (res.rowCount < 1) {
      console.error(
        `[BadgesRepository][isBadgeAccurate] Error - No record found for badge: ${creator}/${name}/${metric} (creator/name/metric).`
      );
      return false;
    }
    return res.rows[0].is_accurate;
  }

  public async updateBadge(params: {
    actionId: number;
    metric: BadgeMetrics;
    lastGenerated?: Date;
    locationPath?: string;
    publicUri?: string;
    value?: string;
  }): Promise<void> {
    const updateVars = ["lastGenerated", "locationPath", "publicUri", "value"];
    const { qu, vars } = Object.keys(params)
      .filter(
        (k) =>
          updateVars.includes(k) &&
          !!(params[k as keyof typeof params] as unknown)
      )
      .reduce(
        (acc, cur) => {
          const key = cur.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`); // snake case
          return {
            qu: [acc.qu, `${key} = ?`].join(", "),
            vars: [...acc.vars, params[cur as keyof typeof params]],
          };
        },
        { qu: "", vars: <any>[] }
      );

    const query = `
      UPDATE "${this.tableName}" SET ${qu} WHERE actionId = ? AND metric = ?;
    `;

    await this.client.query(query, [...vars, params.actionId, params.metric]);
  }

  public async getBadge({
    actionId,
    metric,
  }: {
    actionId: number;
    metric: BadgeMetrics;
  }): Promise<Badge> {
    const query = `
      SELECT * from "${this.tableName}" WHERE action_id = ? AND metric = ?;
    `;
    const res = await this.client.query(query, [actionId, metric]);

    if (res.rowCount < 1) {
      const message = `[BadgesRepository][getBadge] Error - No record found for badge for action_id: ${actionId} and metric: ${metric}`;
      console.error(message);
      throw new Error(message);
    }

    return res.rows[0];
  }
}
