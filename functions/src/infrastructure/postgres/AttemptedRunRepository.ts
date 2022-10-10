import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import { MigrationAttemptedRun } from "../../domain/AttemptedActionRun.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "AttemptedRuns" (
  "id" BIGSERIAL PRIMARY KEY,
  "reason" text NOT NULL
);
`;

export default class MigrationAttemptedRunRepository
  implements IPostgresRepostiory
{
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "AttemptedRuns";
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationAttemptedRunRepository> {
    const i = new MigrationAttemptedRunRepository(client);
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
   * Persists a run attempt
   * Returns the Id of the persisted run
   * @param {reason: string}
   * @returns {Number} Id of the persisted attept
   */
  public async create({ reason }: { reason: string }): Promise<number> {
    if (!reason || reason === "") {
      throw new Error("Cannot create attempt, must have valid reason.");
    }
    const exists = await this.client.query(
      `SELECT id FROM "${this.tableName}" WHERE reason = $1;`,
      [reason]
    );
    if (exists.rowCount > 0) {
      return Number(exists.rows[0].id);
    }
    const ret = await this.client.query(
      `INSERT INTO "${this.tableName}" (reason) VALUES ($1) RETURNING id;`,
      [reason]
    );
    if (ret.rowCount < 1) {
      throw new Error(
        `Inserted new attempted run with reason ${reason} but no id was returned.`
      );
    }
    return Number(ret.rows[0].id);
  }

  public async getById(id: number): Promise<MigrationAttemptedRun> {
    const ret = await this.client.query(
      `SELECT * FROM "${this.tableName}" WHERE id = $1;`,
      [id]
    );
    if (ret.rowCount < 1) {
      throw new Error(`AttemptedRun with id ${id} not found.`);
    }

    return { ...ret.rows[0], id: Number(ret.rows[0].id) };
  }
}
