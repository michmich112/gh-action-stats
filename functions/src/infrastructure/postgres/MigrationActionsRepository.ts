import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import { MigrationDbAction } from "../../domain/Action.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Actions" (
  "id" BIGSERIAL PRIMARY KEY,
  "creator" text NOT NULL,
  "name" text NOT NUll,
  "last_update" timestamptz NOT NULL,
  UNIQUE(creator, name)
);
`;

export default class MigrationActionRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "Actions";
    this.client = client;
  }

  public static async New(client: Client): Promise<MigrationActionRepository> {
    const i = new MigrationActionRepository(client);
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

  public async upsert(action: {
    creator: string;
    name: string;
    timestamp: string;
  }): Promise<MigrationDbAction> {
    const e = await this.client.query(
      `SELECT * FROM "${this.tableName}" WHERE creator = $1 and name = $2;`,
      [action.creator, action.name]
    );
    let ret: MigrationDbAction;
    if (e.rowCount > 0) {
      // update last_update
      const recId = e.rows[0].id;
      const res = await this.client.query(
        `UPDATE "${this.tableName}" SET last_update = $1 WHERE id = $2 RETURNING *`,
        [action.timestamp, recId]
      );
      if (res.rowCount < 1) {
        throw new Error(
          `Updated Action with id ${recId} but no value was returned`
        );
      }
      ret = res.rows[0];
    } else {
      // create
      const query = `INSERT INTO "${this.tableName}" (
        creator,
        name,
        last_update
      ) VALUES ($1,$2,$3) RETURNING id, creator, name, last_update;
      `;

      const res = await this.client.query(query, [
        action.creator,
        action.name,
        action.timestamp,
      ]);
      if (res.rowCount < 1) {
        throw new Error(
          `Created New Action with creator ${action.creator} and name ${action.name} but no value was returned`
        );
      }
      ret = res.rows[0];
    }
    if (typeof ret.id !== "number") {
      return { ...ret, id: Number(ret.id) };
    }
    return ret;
  }

  public async getById(id: number): Promise<MigrationDbAction> {
    const res = await this.client.query(
      `SELECT * FROM "${this.tableName}" WHERE id = $1;`,
      [id]
    );
    if (res.rowCount < 1) {
      throw new Error(`No actions with id ${id} found.`);
    }
    return res.rows[0];
  }
}
