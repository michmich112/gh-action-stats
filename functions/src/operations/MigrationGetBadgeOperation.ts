import Badge from "../domain/Badge.type";
import BadgeMetrics from "../domain/BadgeMetrics.type";
import generateBadge from "../domain/methods/badges/generateBadge";
import getBadgeLabel from "../domain/methods/badges/getBadgeLabel";
import MigrationBadgesRepository from "../infrastructure/postgres/BadgesRepository";
import MigrationMetricsRepository from "../infrastructure/postgres/MetricsRepository";
import MigrationActionRepository from "../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";

type GetBadgeOperationParams = {
  creator: string;
  name: string;
  metric: BadgeMetrics;
  params?: object;
};

type GetBadgeOperationReturn =
  | { err: Error }
  | { url: string; outdated: boolean; err?: Error }
  | {
      raw: string;
      outdated?: boolean;
      err?: Error;
    };

const opName = "GetBadgeOperation";

export async function GetBadgeOperation({
  creator,
  name,
  metric,
  params = {},
}: GetBadgeOperationParams): Promise<GetBadgeOperationReturn> {
  console.log(`[${opName}] START - New Request for`, { creator, name, metric });
  const client = await PostgresConnectedClient();
  if (!client) {
    console.error("Unable to connect to persistance");
    console.log(`[${opName}] END - Error`);
    return { err: new Error("Unable to connect to persistance") };
  }

  const badgeRepo = await MigrationBadgesRepository.New(client);

  try {
    let badge: Badge | undefined;
    try {
      badge = await badgeRepo.getBadge({
        actionId: { creator, name },
        metric,
      });
    } catch (e) {
      console.warn(`[${opName}] Did not find badge.`, e);
    }

    if (badge) {
      const isAccurate = await badgeRepo.isBadgeAccurate({
        creator,
        name,
        metric,
      });

      const ret = { url: badge.publicUri, outdated: !isAccurate };
      console.log(`[${opName}] END - Success: `, ret);
      return ret;
    } else {
      const metricRepo = await MigrationMetricsRepository.New(client);

      // check if metric exists
      const metricExists = await metricRepo.metricExists(metric);
      if (!metricExists) {
        const ret = { err: new Error(`Metric ${metric} is not defined`) };
        console.log(`[${opName}] END - Metric ${metric} is not defined.`);
        return ret;
      }

      const actionRepo = await MigrationActionRepository.New(client);
      const action = await actionRepo.getByCreatorAndName(creator, name);
      const value = await metricRepo.computeMetric(metric, {
        ...params,
        actionId: action.id,
        actionCreator: action.creator,
        actionName: action.name,
        actionLastUpdate: action.last_update,
      });

      const badge = generateBadge({
        label: getBadgeLabel(metric),
        value: value.toString(),
      });
      const rett = { raw: badge, outdated: true };
      console.log(
        `[${opName}] END - Created New Badge for metric ${metric}:`,
        rett
      );
      return rett;
    }
  } catch (e) {
    console.error(`[${opName}] Error - Unexpected Error`, e);
    return { err: e as Error };
  }
}
