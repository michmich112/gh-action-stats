// import { Client } from "pg";
// import MigrationActionRepository from "../../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../../infrastructure/postgres/PostgresClient";
// import MigrationUsersPulseRepoAccessesRepository from "../../infrastructure/postgres/UserPulseRepoAccessesRepository";

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

// async function RefreshPulseRepoAccessesOperationImplementation(
//   client: Client,
//   { userId, userGithubToken }: RefreshPulseRepoAccessesOperationParams
// ): Promise<void> {
//   const actionRepo = await MigrationActionRepository.New(client);
//   const userPulseRepoAccessRepo =
//     await MigrationUsersPulseRepoAccessesRepository.New(client);
//
//   const ownedActions = await actionRepo.getAllActionsWhereUserIsCreator(userId);
//
//   // set all existing accesses to false
//   await userPulseRepoAccessRepo.revertAllPulseRepoAccessesForUser(userId);
//
//   // Get all pulse repositories that need to be validated
//   // Set all the pulse repo access to false
//   // run operation on all pulse repositories & update PulseRepoAccesses
// }
