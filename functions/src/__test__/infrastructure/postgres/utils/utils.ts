/**
 * Utilities for integration testing
 */

import { randomUUID } from "crypto";
import ActionRun from "../../../../domain/ActionRun.type";
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

export function timedTest(
  testFn: (...argv: any[]) => void | Promise<void>
): (...argv: any) => void | Promise<void> {
  return async (...argv: any) => {
    console.time("timedTest");
    try {
      await testFn(...argv);
    } catch (e) {
      throw e;
    } finally {
      console.timeEnd("timedTest");
    }
  };
}

/**
 * Wipes all data of selected tables
 * @param {Client} client -  aconnected postgres client
 * @param {string[]} tableNames - a in-ordered list of tables
 * @param {boolean}  soft=false - choose whether an error in this process should soft the process by throwing higher order error
 * @param {boolean} sequential=flase - choose whether to process all the wipes in parallel or sequentially (one by one, lower performance)
 */
export async function wipeData(
  client: any,
  tableNames: string[],
  soft: boolean = false,
  sequential: boolean = false
) {
  if (!sequential) {
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
  } else {
    const errors = [];
    for (let tn of tableNames) {
      await client.query(`DELETE FROM "${tn}";`).catch((e: any) => {
        console.warn(`[WipeData]- error deleting from ${tn}`, e);
        errors.push(tn);
      });
    }
    if (!soft && errors.length > 0) {
      throw new Error(`[WipeData] - Error wiping data;`);
    }
  }
}

/**
 * Creates a known user
 * @param {Client} client - a connected postgresql client
 * @return {string} - the user id (uuid)
 */
export async function createKnownUser(
  client: any,
  index: number = 0,
  user: {
    github_username?: string;
    github_id?: number;
    avatar_url?: string;
  } = {}
): Promise<string> {
  let knownSupabaseUserId: string;
  const existingUsers = await client.query(
    `SELECT * FROM "auth"."users" LIMIT ${Math.max(index + 1, 10)}`
  );

  if (existingUsers.rowCount === 0 || existingUsers.rowCount <= index) {
    // create known supabase user
    knownSupabaseUserId = randomUUID();

    const createdUserId = await client.query(
      'INSERT INTO "auth"."users" (id, reauthentication_token, email_change_token_current) VALUES ($1, $2, $3) RETURNING id;',
      [knownSupabaseUserId, randomUUID(), randomUUID()]
    );
    if (createdUserId.rowCount === 0) {
      console.error("Error creating new supabase user");
      knownSupabaseUserId = "";
    } else {
      knownSupabaseUserId = createdUserId.rows[0].id;
    }
  } else {
    knownSupabaseUserId = existingUsers.rows[index].id;
  }

  //create known user
  await client.query(
    `INSERT INTO "Users" (id, github_username, github_id, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT ("id") DO NOTHING`,
    [
      knownSupabaseUserId,
      user.github_username ?? "known_username",
      user.github_id ?? 12345,
      user.avatar_url,
    ]
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

export const defaultActionRun: ActionRun = {
  creator: "toto",
  github_action: "workflow_step_name",
  github_actor: "actor",
  github_base_ref: "base/ref",
  github_head_ref: "head/ref",
  github_ref: "base/ref",
  github_repository: "user/repository",
  github_run_id: "1234353",
  github_event_name: "push",
  github_action_repository: "michmich112/versionbumper@main",
  package_version: "0.1.0",
  ip: "1.2.3.4",
  name: "toto_action",
  runner_os: "Linux",
  runner_name: "HostedRunner",
  timestamp: new Date().toISOString(),
  version: "main_branch",
  execution_time: [0, 123456789],
  error: null,
};

export async function createKnownAction(
  client: any,
  action: { creator?: string; name?: string; last_update?: Date } = {}
) {
  // create placeholder toto action
  const res = await client.query(
    'INSERT INTO "Actions" (creator, name, last_update) VALUES ($1, $2, $3) RETURNING id;',
    [
      action.creator ?? "toto",
      action.name ?? "toto_action",
      action.last_update ?? new Date(0).toISOString(),
    ]
  );

  return parseInt(res.rows[0].id);
}
