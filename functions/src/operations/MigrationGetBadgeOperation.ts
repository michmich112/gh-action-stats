import { Client } from "pg";
import BadgeMetrics from "../domain/BadgeMetrics.type";
import MigrationBadgesRepository from "../infrastructure/postgres/BadgesRepository";
import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";

type GetBadgeOperationParams = {
  creator: string;
  repo: string;
  metric: BadgeMetrics;
};

type GetBadgeOperationReturn = {
  url?: string;
  outdated?: boolean;
  raw?: string;
  error?: Error;
};

export default async function GetBadgeOperation({
  creator,
  repo,
  metric,
}: GetBadgeOperationParams): Promise<GetBadgeOperationReturn> {
  let PostgresClient: Client;
  try {
    // SupabaseClient = getClient();
    const tmpClient = await PostgresConnectedClient();
    if (tmpClient === null) {
      throw new Error("Error initialize Postgres Client");
    }
    PostgresClient = tmpClient;
  } catch (e) {
    console.error(
      `[GetBadgeOperation] Error - Unable to initialize SupabaseClient or PostgresClient`,
      e
    );
    return { error: e as Error };
  }

  const BadgeRepository = await MigrationBadgesRepository.New(PostgresClient);
  await BadgeRepository.isBadgeAccurate({ creator, name: repo, metric });
  return {};
}
