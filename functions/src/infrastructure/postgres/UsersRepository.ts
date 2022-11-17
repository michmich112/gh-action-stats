import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import { MigrationUser } from "../../domain/User.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY NOT NULL REFERENCES "auth"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "github_username" TEXT NOT NULL,
  "github_id" BIGINT NOT NULL,
  "avatar_url" TEXT,
  "last_refresh" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const tableConstraints: string = `
  CREATE INDEX IF NOT EXISTS user_gh_username_idx ON "Users"("github_username");
  CREATE INDEX IF NOT EXISTS user_gh_id_idx ON "Users"("github_id");
`; // none so far

type dbUser = {
  id: string;
  github_username: string; // this will exist as we create the user when we've queried it
  github_id: string;
  avatar_url?: string | null; // this may not always exist
  last_refresh: Date;
};

function DbUserToUserMapper(user: dbUser): MigrationUser {
  return {
    id: user.id,
    githubUsername: user.github_username,
    githubId: parseInt(user.github_id),
    avatarUrl: user.avatar_url || undefined,
    lastRefresh: user.last_refresh,
  };
}

// Currently Unused
// function UserToDBMapper(user: MigrationUser): dbUser {
//   return {
//     id: user.id,
//     github_username: user.githubUsername,
//     github_id: user.githubId,
//     avatar_url: user.avatarUrl,
//     last_refresh: user.lastRefresh,
//   };
// }

const classname = "[UserRepository]";

export default class MigrationUsersRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "Users";
    this.client = client;
  }

  public static async New(client: Client): Promise<MigrationUsersRepository> {
    const i = new MigrationUsersRepository(client);
    await i.mustExec();
    return i;
  }

  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
    await this.client.query(tableConstraints); // apply table constraints
  }

  private async getUserBySingleKey(
    dbKeyName: string,
    keyValue: string | number
  ): Promise<dbUser> {
    const query = `
      SELECT * FROM "${this.tableName}" WHERE ${dbKeyName} = $1;
    `;
    const res = await this.client.query(query, [keyValue]);
    if (res.rowCount < 1) {
      throw new Error(
        `[${classname}][getUserBy${dbKeyName}] - Error geting user where ${dbKeyName} = ${keyValue.toString()}`
      );
    }
    return res.rows[0];
  }

  public async getUserById(userId: string): Promise<MigrationUser> {
    const user = await this.getUserBySingleKey("id", userId);
    return DbUserToUserMapper(user);
  }
  public async getUserByGithubUsername(
    username: string
  ): Promise<MigrationUser> {
    const user = await this.getUserBySingleKey("github_username", username);
    return DbUserToUserMapper(user);
  }
  public async getUserByGithubId(id: number): Promise<MigrationUser> {
    const user = await this.getUserBySingleKey("github_id", id);
    return DbUserToUserMapper(user);
  }

  public async updateUser(newUser: MigrationUser): Promise<void> {
    const query = `
      UPDATE "${this.tableName}" SET 
        github_username = $2,
        github_id = $3,
        avatar_url = $4,
        last_refresh = $5
      WHERE id = $1;
    `;
    try {
      await this.client.query(query, [
        newUser.id,
        newUser.githubUsername,
        newUser.githubId,
        newUser.avatarUrl,
        newUser.lastRefresh,
      ]);
    } catch (e) {
      console.error(
        `[${classname}][updatedUser] - Error updating user: ${JSON.stringify(
          newUser
        )}.`,
        e
      );
      throw e;
    }
  }
  public async createUser(newUser: MigrationUser): Promise<void> {
    const query = `
      INSERT INTO "${this.tableName}" (
        id,
        github_username,
        github_id,
        avatar_url,
        last_refresh
      ) VALUES ($1, $2, $3, $4, $5);
    `;
    try {
      await this.client.query(query, [
        newUser.id,
        newUser.githubUsername,
        newUser.githubId,
        newUser.avatarUrl,
        newUser.lastRefresh,
      ]);
    } catch (e) {
      console.error(
        `[${classname}][createUser] - Error updating user: ${JSON.stringify(
          newUser
        )}.`,
        e
      );
      throw e;
    }
  }
}
