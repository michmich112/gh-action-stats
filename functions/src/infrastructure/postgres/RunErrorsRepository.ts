import { Client } from "pg";

import { IPostgresRepostiory } from "../../domain/IRepository";
import { RunError } from "../../domain/RunError.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "RunErrors" (
  "id" BIGSERIAL PRIMARY KEY,
  "message" text,
  "name" text,
  "stack" text
);
`;

export default class MigrationRunErrorsRepository
  implements IPostgresRepostiory
{
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "RunErrors";
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationRunErrorsRepository> {
    const i = new MigrationRunErrorsRepository(client);
    await i.mustExec();
    return i;
  }

  /**
   * Any queries that must execute successfully for us to start using the DB
   * Generally used to create the table if it doesn't exist or run migrations on the schema if needed.
   */
  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
    // await this.client.query(tableConstraints);
  }

  /**
   * Create a new error in the db
   * @returns {Number} Error Id
   */
  public async create({
    message,
    name,
    stack,
  }: {
    message?: string | null;
    name?: string | null;
    stack?: string | null;
  }): Promise<number> {
    if (!message && !name && !stack) {
      throw new Error("No run error information was present.");
    }
    const exists = await this.client.query(
      `SELECT id FROM "${this.tableName}" WHERE message=$1 AND name=$2 AND stack=$3;`,
      [message, name, stack]
    );
    if (exists.rowCount > 0) {
      return Number(exists.rows[0].id);
    }
    const query = `INSERT INTO "${this.tableName}" (
      message,
      name,
      stack
    ) VALUES ($1, $2, $3) 
    RETURNING id;`;
    const res = await this.client.query(query, [message, name, stack]);
    if (res.rowCount < 1) {
      throw new Error("Inserted new error but no ID returned.");
    }
    return Number(res.rows[0].id);
  }

  public async getById(id: number): Promise<RunError> {
    const res = await this.client.query(
      `SELECT * FROM "${this.tableName}" WHERE id = $1 LIMIT 1;`,
      [id]
    );
    if (res.rowCount < 1) {
      throw new Error(`No RunError with id ${id} found.`);
    }
    const ret = res.rows[0];
    if (typeof ret.id !== "number") {
      return { ...ret, id: Number(ret.id) };
    }
    return ret;
  }
}
