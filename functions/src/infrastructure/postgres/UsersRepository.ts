import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import { MigrationUser } from "../../domain/User.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY NOT NULL REFERENCES "auth"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "github_username" TEXT NOT NULL,
  "github_id" BIGINT NOT NULL,
  "avatar_url" TEXT
);
`;

const tableConstraints: string = `

`;

const classname = "[UserRepository]";

export default class MigrationUsersRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "MetricDefinitions";
    this.client = client;
  }

  public static async New(client: Client): Promise<MigrationUsersRepository> {
    const i = new MigrationUsersRepository(client);
    await i.mustExec();
    return i;
  }

  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
  }

  public async getUserById(userId: string): Promise<MigrationUser> {
    const query = `
      SELECT * FROM ${this.tableName} WHERE id = $1;
    `;
    const res = await this.client.query(query, [userId]);
    if (res.rowCount < 1) {
      throw new Error(
        `${classname}[getUserById] - Error getting user with id ${userId}`
      );
    }
    return;
  }
  public async getUserByGithubUsername(
    username: string
  ): Promise<MigrationUser> {}
  public async getUserByGithubId(id: number): Promise<MigrationUser> {}
  public async updateUser(newUser: MigrationUser): Promise<void> {}
  public async createUser(newUser: MigrationUser): Promise<void> {}
}
