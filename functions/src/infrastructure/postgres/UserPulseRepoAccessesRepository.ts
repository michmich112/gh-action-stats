import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";
import {
  NewUserPulseRepoAccess,
  UserPulseRepoAccess,
  UserPulseRepoAccessKey,
} from "../../domain/UserPulseRepoAccess.type";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "UserPulseRepoAccesses" (
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "pulse_repo_id" BIGINT NOT NULL ON UPDATE CASCADE ON DELETE CASCADE,
  "can_access" BOOLEAN NOT NULL DEFAULT FALSE,
  "last_polled" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY("user_id", "pulse_repo_id")
);
`;

interface DbUserPulseRepoAccessKey {
  user_id: string;
  pulse_repo_id: string;
}

interface DbUserPulseRepoAccess extends DbUserPulseRepoAccessKey {
  can_access: boolean;
  last_polled: Date;
}

function DbToDomainUserPulseRepoAccessKey(
  key: DbUserPulseRepoAccessKey
): UserPulseRepoAccessKey {
  return {
    userId: key.user_id,
    pulseRepoId: parseInt(key.pulse_repo_id),
  };
}

function DbToDomainUserPulseRepoAccess(
  upra: DbUserPulseRepoAccess
): UserPulseRepoAccess {
  return {
    ...DbToDomainUserPulseRepoAccessKey({
      user_id: upra.user_id,
      pulse_repo_id: upra.pulse_repo_id,
    }),
    canAccess: upra.can_access,
    lastPolled: upra.last_polled,
  };
}

const classname = "UserPulseRepoAccessesRepository";

export default class MigrationUsersPulseRepoAccessesRepository
  implements IPostgresRepostiory
{
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "UserPulseRepoAccesses";
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationUsersPulseRepoAccessesRepository> {
    const i = new MigrationUsersPulseRepoAccessesRepository(client);
    await i.mustExec();
    return i;
  }

  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
  }

  public async createPulseRepoAccessRule({
    userId,
    pulseRepoId,
    canAccess,
  }: NewUserPulseRepoAccess): Promise<UserPulseRepoAccess> {
    const query = `
      INSERT INTO "${this.tableName}" (
        user_id,
        pulse_repo_id,
        can_access
      ) VALUES ($1,$2,$3) 
      ON CONFLICT("user_id", "pulse_repo_id") DO UPDATE SET
        can_acces=$3,
        last_polled=NOW()
      RETURNING *;
    `;
    const res = await this.client.query(query, [
      userId,
      pulseRepoId,
      canAccess,
    ]);
    if (res.rowCount < 1) {
      throw new Error(
        `[${classname}][createPulseRepoAccessRule] - Error Creating new UserPulseRepoAceessRule: ${JSON.stringify(
          { userId, pulseRepoId, canAccess }
        )}`
      );
    }
    return DbToDomainUserPulseRepoAccess(res.rows[0]);
  }

  /**
   * Update if the user has access to the pulse repository
   * Automatically updates the lastPolled timestamp
   * @param {string} userId - the id of the user
   * @param {number} pulseRepoId - the id of the pulse repo
   * @param {boolean} canAccess - the flag indicating whether a user can access the repo or not
   */
  public async updateCanAccessPulseRepoAccessRule(
    userId: string,
    pulseRepoId: number,
    canAccess: boolean
  ): Promise<void> {
    const query = `
      UPDATE "${this.tableName}" SET
        can_access = $1,
        last_polled = NOW()
      WHERE user_id = $2 AND pulse_repo_id = $3;
    `;
    await this.client.query(query, [canAccess, userId, pulseRepoId]);
  }

  /**
   * Automatically updates the last Polled time with no changes
   * @param {string} userId - the id of the user who has the pulse repo access rule
   * @param {number} pulseRepoId - the id of the pulse repo that was polled
   */
  public async updateLastPolledTime(
    userId: string,
    pulseRepoId: number
  ): Promise<void> {
    const query = `
      UPDATE "${this.tableName}" SET
        last_polled = NOW()
      WHERE user_id = $1 AND pulse_repo_id = $2;
    `;
    await this.client.query(query, [userId, pulseRepoId]);
  }

  /**
   * Validates if there exists a PulseRepoAccessRule for a specific user and pulse repo
   * @param {string} userId - the id of the user from whom you want to query the pulse repo access rule
   * @param {number} pulseRepoId - the id of the pulse repo you want to query the access rule for
   */
  public async userPulseRepoAccessRuleExists(
    userId: string,
    pulseRepoId: number
  ): Promise<boolean> {
    const query = `
      SELECT EXISTS (SELECT * FROM "${this.tableName}" WERE user_id = $1 and pulse_repo_id = $2);
    `;
    const res = await this.client.query(query, [userId, pulseRepoId]);
    return res.rows[0].exists;
  }

  /**
   * Get a single user pulse repo access rule
   * @param {string} userId - the id of the user from whom you want to query the pulse repo access rule
   * @param {number} pulseRepoId - the id of the pulse repo you want to query the access rule for
   */
  public async getUserPulseRepoAccessRule(
    userId: string,
    pulseRepoId: number
  ): Promise<UserPulseRepoAccess> {
    const query = `
      SELECT * FROM "${this.tableName}" WHERE user_id = $1 and pulse_repo_id = $2;
    `;
    const res = await this.client.query(query, [userId, pulseRepoId]);
    if (res.rowCount < 1) {
      throw new Error(
        `[${classname}][getUserPulseRepoAccessRule] - No user pulse repo access rule exists for user with Id: ${userId} and pulseRepoId: ${pulseRepoId}`
      );
    }
    return DbToDomainUserPulseRepoAccess(res.rows[0]);
  }

  /**
   * Retrieve all the pulse repo accesses for a specific user
   * @param {string} userId - the id of the user for whom you want to query the pulse repo access rules
   */
  public async getAllPulseRepoAccessesForUser(
    userId: string
  ): Promise<UserPulseRepoAccess[]> {
    const query = `
      SELECT * FROM "${this.tableName}" WHERE user_id = $1;
    `;
    const res = await this.client.query(query, [userId]);
    if (res.rowCount === 0) return [];
    return res.rows.map((v) => DbToDomainUserPulseRepoAccess(v));
  }

  /**
   * Retrieve all the outdated pulse repo rules for a specific user
   * @param {string} userId - the id of the user for whom you want to query the outdated pulse repo access rules
   * @param {number} pollFrequency=86400 - the frequency at which we should poll the pulse repo accesses, in seconds. Defaults to 1 day (24 hours)
   */
  public async getAllOutdatedPulseRepoAccessesKeysForUser(
    userId: string,
    pollFrequency: number = 86400
  ): Promise<UserPulseRepoAccessKey[]> {
    const query = `
      SELECT 
        t.user_id,
        t.pulse_repo_id
      FROM "${this.tableName}" t 
      WHERE 1=1
        AND t.user_id = $1 
        AND EXTRACT(EPOCH FROM (NOW() - t.last_polled) >= $2);
    `;
    const res = await this.client.query(query, [userId, pollFrequency]);
    if (res.rowCount === 0) return [];
    return res.rows.map((v) => DbToDomainUserPulseRepoAccessKey(v));
  }
}
