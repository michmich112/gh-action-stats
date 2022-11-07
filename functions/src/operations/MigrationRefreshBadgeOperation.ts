import { SupabaseClient } from "@supabase/supabase-js";
import { Client } from "pg";
import Badge from "../domain/Badge.type";
import BadgeMetrics from "../domain/BadgeMetrics.type";
import generateBadge from "../domain/methods/badges/generateBadge";
import getBadgeLabel from "../domain/methods/badges/getBadgeLabel";
import getBadgeStoragePath from "../domain/methods/badges/getBadgeStoragePath";
import MigrationBadgesRepository from "../infrastructure/postgres/BadgesRepository";
import MigrationMetricsRepository from "../infrastructure/postgres/MetricsRepository";
import MigrationActionRepository from "../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";
import BadgeStorage from "../infrastructure/supabase/storage/BadgeStorage";
import { getClient } from "../infrastructure/supabase/SupabaseClient";

const opName = "RefreshBadgeOperation";

type RefreshBadgeOperationParams = {
  creator: string;
  name: string;
  metric: string;
  params?: object;
};

export async function RefreshBadgeOperation({
  creator,
  name,
  metric,
  params = {},
}: RefreshBadgeOperationParams): Promise<void> {
  console.log(
    `[${opName}] START - New request for`,
    JSON.stringify({ creator, name, metric })
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
    const supaClient = getClient();
    await RefreshBadgeOperationImplementation(
      { creator, name, metric, params },
      client,
      supaClient
    );
    // commit transaction
    await client.query("COMMIT;");
    console.log(
      `[${opName}] END - Success refreshing badge: ${JSON.stringify({
        creator,
        name,
        metric,
      })}`
    );
  } catch (e) {
    // Rollback transaction on error
    console.error(`[${opName}] END - Error encountered, rolling back.`, e);
    await client.query("ROLLBACK;");
  } finally {
    // ensure we close the client cleanly after the RefreshBadgeOperationImplementation
    await client.end();
  }
}

async function RefreshBadgeOperationImplementation(
  params: RefreshBadgeOperationParams,
  pgClient: Client,
  supabaseClient: SupabaseClient
): Promise<void> {
  const actionRepo = await MigrationActionRepository.New(pgClient);
  const badgeRepo = await MigrationBadgesRepository.New(pgClient);
  const { creator, name, metric } = params;
  const action = await actionRepo.getByCreatorAndName(creator, name);
  const badgeExists = await badgeRepo.badgeExists({
    actionId: action.id,
    metric: metric as BadgeMetrics,
  });

  let badge: Badge | null = null;
  if (badgeExists) {
    badge = await badgeRepo.getBadge({
      actionId: action.id,
      metric: metric as BadgeMetrics,
    });
  }

  const metricRepo = await MigrationMetricsRepository.New(pgClient);

  const value = await metricRepo.computeMetric(metric, {
    ...params.params,
    actionId: action.id,
    actionCreator: action.creator,
    actionName: action.name,
    actionLastUpdate: action.last_update,
  });
  const path = badge
    ? badge.locationPath
    : getBadgeStoragePath({ creator, name, metric });
  const badgeSvg = generateBadge({
    label: getBadgeLabel(metric),
    value: value.toString(),
  });

  const badgeStorageRepo = await BadgeStorage.New(supabaseClient);

  await badgeStorageRepo.put(path, badgeSvg);
  const uri = await badgeStorageRepo.getPublicUrl(path);

  const newBadgeDef: Badge = {
    actionId: action.id,
    metric: metric as BadgeMetrics,
    value: value.toString(),
    lastGenerated: new Date(),
    locationPath: path,
    publicUri: uri,
  };

  await badgeRepo.updateBadge(newBadgeDef);
}
