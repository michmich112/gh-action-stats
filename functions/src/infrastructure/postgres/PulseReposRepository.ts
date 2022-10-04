import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import { PulseRepo } from "../../domain/PulseRepo.type";
import {
  getRepoOwnerAndNameFromString,
  hashString,
} from "../../utils/githubUtils";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS"PulseRepos" (
  "id" BIGSERIAL PRIMARY KEY,
  "owner" text NOT NULL,
  "name" text NOT NULL,
  "hashed_name" text,
  "full_name" text,
  "full_hashed_name" text,
  UNIQUE (owner, name)
);
`;

export default class MigrationPulseRepoRepository
  implements IPostgresRepostiory
{
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "PulseRepos";
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationPulseRepoRepository> {
    const i = new MigrationPulseRepoRepository(client);
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
   * Retrieves a PulseRepo from the db and creates it if it doesn't yet exists.
   */
  public async getFromGithubRepositoryString(
    ghRepo: string
  ): Promise<PulseRepo> {
    let pr: PulseRepo;
    const { owner, name } = getRepoOwnerAndNameFromString(ghRepo);
    const exists = await this.client.query(
      `SELECT * FROM "${this.tableName}" WHERE owner = $1 and name = $2;`,
      [owner, name]
    );
    if (exists.rowCount > 0) {
      pr = exists.rows[0];
    } else {
      const hashed_name = hashString(name);
      const res = await this.client.query(
        `
                                        INSERT INTO "${this.tableName}" (
                                          owner, name, hashed_name, full_name, full_hashed_name
                                        ) VALUES ($1, $2, $3, $4, $5) RETURNING *;
                                        `,
        [
          owner,
          name,
          hashed_name,
          [owner, name].join("/"),
          [owner, hashed_name].join("/"),
        ]
      );
      if (res.rowCount < 1) {
        throw new Error(
          `Inserted pulse repo with owner:${owner} and name:${name}, but did not get return values`
        );
      }
      pr = res.rows[0];
    }
    if (typeof pr.id !== "number") {
      return { ...pr, id: Number(pr.id) };
    }
    return pr;
  }
}
