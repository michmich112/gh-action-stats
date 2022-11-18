/**
 * Utilities for integration testing
 */

import { randomUUID } from "crypto";
import { UserPulseRepoAccess } from "../../../../domain/UserPulseRepoAccess.type";

/**
 * @param {string} eut - element under test. Used for logging
 */
export function skipTest(
  client: any,
  repo: any,
  eut: string,
  soft: boolean = false
): boolean {
  if (!client || !repo) {
    if (soft) {
      console.warn(`[${eut}] - client or repo not initialized. Skipping tests`);
      return false;
    }
    throw new Error(
      `[${eut}] - client or repo not initialized. Cancelling tests`
    );
  }
  return true;
}

/**
 * Wipes all data of selected tables
 * @param {Client} client -  aconnected postgres client
 * @param {string[]} tableNames - a in-ordered list of tables
 * @param {boolean}  soft=false - choose whethere an error in this process should soft the process by throwing higher order error
 */
export async function wipeData(
  client: any,
  tableNames: string[],
  soft: boolean = false
) {
  const res = await Promise.allSettled(
    tableNames.map((tn) => client.query(`DELETE FROM "${tn}";`))
  );

  const rejects = res.filter((r) => r.status === "rejected");
  if (rejects.length > 0) {
    const message = `[wipeData] - Error Wiping Data, ${JSON.stringify(
      rejects.map((r) => (r as PromiseRejectedResult).reason)
    )}`;

    if (!soft) throw new Error(message);
    else console.warn(message);
  }
}

/**
 * Creates a known user
 * @param {Client} client - a connected postgresql client
 * @return {string} - the user id (uuid)
 */
export async function createKnownUser(client: any): Promise<string> {
  let knownSupabaseUserId: string;
  const existingUsers = await client.query(
    'SELECT * FROM "auth"."users" LIMIT 10'
  );

  if (existingUsers.rowCount === 0) {
    // create known supabase user
    knownSupabaseUserId = randomUUID();

    const createdUserId = await client.query(
      'INSERT INTO "auth"."users" (id) VALUES ($1) RETURNING id;',
      [knownSupabaseUserId]
    );
    if (createdUserId.rowCount === 0) {
      console.error("Error creating new supabase user");
      knownSupabaseUserId = "";
    } else {
      knownSupabaseUserId = createdUserId.rows[0].id;
    }
  } else {
    knownSupabaseUserId = existingUsers.rows[0].id;
  }

  //create known user
  await client.query(
    `INSERT INTO "Users" (id, github_username, github_id, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT ("id") DO NOTHING`,
    [knownSupabaseUserId, "known_username", 12345, undefined]
  );

  return knownSupabaseUserId;
}

export async function createKnownPulseRepo(
  client: any,
  pulseRepo: {
    owner: string;
    name: string;
    fullname: string;
    hashed_name?: string;
    full_hashed_name?: string;
  },
  soft: boolean = true
): Promise<number> {
  const res = await client.query(
    `INSERT INTO "PulseRepos" (owner, name, hashed_name, full_name, full_hashed_name) VALUES ($1,$2,$3,$4,$5) RETURNING id;`,
    [
      pulseRepo.owner,
      pulseRepo.name,
      pulseRepo.hashed_name ?? `${pulseRepo.name}_hashed`,
      pulseRepo.fullname,
      pulseRepo.full_hashed_name ?? `${pulseRepo.fullname}_hashed`,
    ]
  );
  if (!res.rows[0].id) {
    const message = `[testUtils][createKnownPulseRepo] - Error creating known pulse repo: ${JSON.stringify(
      pulseRepo
    )}`;
    if (soft) console.error(message);
    else throw new Error(message);
  }
  return parseInt(res.rows[0].id);
}

export async function createKnownUserPulseRepoAccessRule(
  client: any,
  upra: UserPulseRepoAccess,
  soft: boolean = true
): Promise<UserPulseRepoAccess> {
  try {
    await client.query(
      `INSERT INTO "UserPulseRepoAccesses" (user_id, pulse_repo_id, can_access, last_polled) VALUES ($1, $2, $3 ,$4);`,
      [upra.userId, upra.pulseRepoId, upra.canAccess, upra.lastPolled]
    );
  } catch (e) {
    const message = `[testUtils][createKnownUserPulseRepoAccessRule] - Error creating known user pulse repo rule ${JSON.stringify(
      upra
    )}`;
    if (soft) {
      console.error(message, e);
    } else {
      throw new Error(message);
    }
  }
  return upra;
}
