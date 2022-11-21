import { Client } from "pg";
import { PulseRepo } from "../../domain/PulseRepo.type";
import { GithubApi } from "../../infrastructure/github/GitHubUserApi";
import MigrationActionRepository from "../../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
import MigrationPulseRepoRepository from "../../infrastructure/postgres/PulseReposRepository";
import MigrationUsersPulseRepoAccessesRepository from "../../infrastructure/postgres/UserPulseRepoAccessesRepository";

type RefreshPulseRepoAccessesOperationParams = {
  userId: string;
  userGithubToken: string;
};

const opName = "RefreshPulseRepoAccessesOperation";
export async function RefreshPulseRepoAccessesOperation(
  params: RefreshPulseRepoAccessesOperationParams
): Promise<void> {
  console.log(
    `[${opName}] START - New request with params: ${JSON.stringify(params)}`
  );
  const client = await PostgresConnectedClient();
  if (!client) {
    console.error("Unable to connect to persistance");
    console.log(`[${opName}] END - Error`);
    return;
  }
  try {
    // start transaction
    await client.query("BEGIN;");
    // Run Implementation
    await RefreshPulseRepoAccessesOperationImplementation(client, params);
    // commit transaction
    await client.query("COMMIT;");
    console.log(`[${opName}] END - Success refreshing pulse repo accesses.`);
  } catch (e) {
    // Rollback transaction on error
    console.error(`[${opName}] END - Error encountered, rolling back.`, e);
    await client.query("ROLLBACK;");
  } finally {
    // ensure we close the client cleanly after the RefreshBadgeOperationImplementation
    await client.end();
  }
}

async function RefreshPulseRepoAccessesOperationImplementation(
  client: Client,
  { userId, userGithubToken }: RefreshPulseRepoAccessesOperationParams
): Promise<void> {
  const actionRepo = await MigrationActionRepository.New(client);
  const pulseRepoRepo = await MigrationPulseRepoRepository.New(client);
  const userPRAccessesRepo =
    await MigrationUsersPulseRepoAccessesRepository.New(client);
  const ghApi = await GithubApi.New(userGithubToken);
  // initialized

  // set all existing accesses to false
  await userPRAccessesRepo.revertAllPulseRepoAccessesForUser(userId);

  const ownedActions = await actionRepo.getAllActionsWhereUserIsCreator(userId);
  const pulseRepos = await pulseRepoRepo.getAllPulseReposForActions(
    ownedActions.map((a) => a.id)
  );

  async function updateRepo(pr: PulseRepo) {
    const can_access = await ghApi.isRepoAccessible(pr.owner, pr.name);
    const ruleExists = await userPRAccessesRepo.userPulseRepoAccessRuleExists(
      userId,
      pr.id
    );
    if (ruleExists) {
      await userPRAccessesRepo.updateCanAccessPulseRepoAccessRule(
        userId,
        pr.id,
        can_access
      );
    } else {
      await userPRAccessesRepo.createPulseRepoAccessRule({
        userId,
        pulseRepoId: pr.id,
        canAccess: can_access,
      });
    }
  }

  // for (const pr of pulseRepos) {
  //   await updateRepo(pr);
  // }
  const updateResults = await Promise.allSettled(
    pulseRepos.map((pr) => updateRepo(pr))
  );

  const failed = updateResults.filter((ur) => ur.status === "rejected");
  if (failed.length > 0) {
    const message = `[RefreshPulseRepoAccessesOperationImplementation] - Errors updatingRepo ${JSON.stringify(
      failed
    )}`;
    console.error(message);
    throw new Error(message);
  }
}
