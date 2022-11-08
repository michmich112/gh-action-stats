import { Client } from "pg";
import Badge from "../../domain/Badge.type";
import BadgeMetrics from "../../domain/BadgeMetrics.type";

import { IPostgresRepostiory } from "../../domain/IRepository";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Badges" (
  "id" BIGSERIAL PRIMARY KEY,
  "action_id" bigint NOT NULL REFERENCES "Actions" ("id") ON DELETE CASCADE,
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
          FROM "Actions" aa
      ) a on a.creator = $1 AND a.name = $2
      WHERE b.metric = $3;
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
        (acc, cur, i) => {
          const key = cur.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`); // snake case
          return {
            qu: [...acc.qu, `${key} = $${i + 1}`],
            vars: [...acc.vars, params[cur as keyof typeof params]],
          };
        },
        { qu: [] as string[], vars: <any>[] }
      );

    if (qu.length < 1) return; // return without error since there is nothing to update

    const query = `
      UPDATE "${this.tableName}" SET ${qu.join(", ")} 
      WHERE action_id = $${qu.length + 1} AND metric = $${qu.length + 2};
    `;

    await this.client.query(query, [...vars, params.actionId, params.metric]);
  }

  public async getBadge({
    actionId,
    metric,
  }: {
    actionId: number | { name: string; creator: string };
    metric: BadgeMetrics;
  }): Promise<Badge> {
    let res;
    if (typeof actionId === "number") {
      const query = `
        SELECT * from "${this.tableName}" WHERE action_id = $1 AND metric = $2;
      `;
      res = await this.client.query(query, [actionId, metric]);
    } else {
      const query = `
      SELECT 
        b.* 
      from "${this.tableName}" b 
      LEFT JOIN (
        SELECT 
          aa.id,
          aa.name,
          aa.creator
        FROM "Actions" aa
      ) a ON a.id = b.action_id
      WHERE a.name = $1 AND a.creator = $2 AND b.metric = $3;
      `;
      res = await this.client.query(query, [
        actionId.name,
        actionId.creator,
        metric,
      ]);
    }

    if (res.rowCount < 1) {
      const message = `[BadgesRepository][getBadge] Error - No record found for badge for action_id: ${actionId} and metric: ${JSON.stringify(
        metric
      )}`;
      console.error(message);
      throw new Error(message);
    }

    return BadgeMapper(res.rows[0]);
  }

  public async createBadge(badge: Badge): Promise<void> {
    const query = `
      INSERT INTO "${this.tableName}" (
        action_id, 
        metric, 
        last_generated, 
        location_path, 
        public_uri, 
        value) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    `;

    const res = await this.client.query(query, [
      badge.actionId,
      badge.metric,
      badge.lastGenerated,
      badge.locationPath,
      badge.publicUri,
      badge.value,
    ]);
    if (res.rowCount < 1) {
      console.error(
        "[BadgesRepository][createBadge] Error - No rows returned when attempting to create a new badge: ",
        badge
      );
      throw new Error("Error Creating Badge");
    }
    return;
  }

  public async badgeExists({
    actionId,
    metric,
  }: {
    actionId: number;
    metric: BadgeMetrics;
  }): Promise<boolean> {
    const query = `
      SELECT id FROM "${this.tableName}" where action_id = $1 and metric = $2;
    `;
    try {
      const res = await this.client.query(query, [actionId, metric]);
      return res.rowCount > 0;
    } catch (e) {
      return false;
    }
  }
}

// function dbBadgeMapper(b: object): Badge {
//   return Object.keys(b).reduce(
//     (acc, cur) => ({
//       ...acc,
//       [cur.replace(/_[a-z]/g, (l) => l.toUpperCase()).replace(/_/g, "")]:
//         b[cur as keyof typeof b], // change to CamelCase
//     }),
//     {}
//   ) as Badge;
// }

type DbBadge = {
  id: string;
  action_id: string;
  metric: string;
  last_generated: Date;
  location_path: string;
  public_uri: string;
  value: string;
};

function BadgeMapper(b: DbBadge): Badge {
  return {
    actionId: parseInt(b.action_id, 10),
    metric: b.metric as BadgeMetrics,
    lastGenerated: b.last_generated,
    locationPath: b.location_path,
    publicUri: b.public_uri,
    value: b.value,
  };
}
