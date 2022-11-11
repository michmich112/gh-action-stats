import { Client } from "pg";
import Badge from "../domain/Badge.type";
import BadgeMetrics from "../domain/BadgeMetrics.type";
import BadgeView from "../domain/BadgeView.type";
import generateBadge from "../domain/methods/badges/generateBadge";
import getBadgeLabel from "../domain/methods/badges/getBadgeLabel";
import getBadgeStoragePath from "../domain/methods/badges/getBadgeStoragePath";
import MigrationBadgesRepository from "../infrastructure/postgres/BadgesRepository";
import MigrationBadgeViewsRepository from "../infrastructure/postgres/BadgeViewsRepository";
import MigrationMetricsRepository from "../infrastructure/postgres/MetricsRepository";
import MigrationActionRepository from "../infrastructure/postgres/MigrationActionsRepository";
import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";

export type GetBadgeOperationParams = {
  creator: string;
  name: string;
  metric: BadgeMetrics;
  params?: { [key: string]: string };
};

export type GetBadgeOperationReturn =
  | { err: Error }
  | { url: string; outdated: boolean; err?: Error }
  | {
      raw: string;
      outdated?: boolean;
      err?: Error;
    };

const opName = "GetBadgeOperation";

export async function GetBadgeOperation(
  getBadgeParams: GetBadgeOperationParams
): Promise<GetBadgeOperationReturn> {
  console.log(
    `[${opName}] START - New Request for`,
    JSON.stringify(getBadgeParams)
  );
  const client = await PostgresConnectedClient();
  if (!client) {
    console.error("Unable to connect to persistance");
    console.log(`[${opName}] END - Error`);
    return { err: new Error("Unable to connect to persistance") };
  }

  let res: GetBadgeOperationReturn;
  try {
    await client.query("BEGIN;");

    res = await GetBadgeOperationImplementation(getBadgeParams, client);
    if (res.err) {
      // rollback transation if there was an error
      await client.query("ROLLBACK;");
    } else {
      await client.query("COMMIT;");
    }
  } catch (e) {
    console.error(`[${opName}] END - Error encountered, rolling back.`, e);
    await client.query("ROLLBACK;");
    res = { err: e as Error };
  } finally {
    await client.end();
  }
  return res;
}

async function GetBadgeOperationImplementation(
  { creator, name, metric, params = {} }: GetBadgeOperationParams,
  client: Client
): Promise<GetBadgeOperationReturn> {
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
      await logBadgeView(
        {
          badgeId: badge.id,
          timestamp: new Date(),
          utmParameters: {
            source: params?.utm_source,
            medium: params?.utm_medium,
            campaign: params?.utm_campaign,
            term: params?.utm_term,
            content: params?.utm_content,
          },
        },
        client
      );
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

      const rawBadge = generateBadge({
        label: getBadgeLabel(metric),
        value: value.toString(),
      });

      await badgeRepo.createBadge({
        actionId: action.id,
        metric: metric as BadgeMetrics,
        lastGenerated: new Date(0),
        locationPath: getBadgeStoragePath({ creator, name, metric }),
        publicUri: "", // this will be updated since the last Generated is old and it will be updated
        value: value.toString(),
      });

      const newBadge = await badgeRepo.getBadge({
        actionId: action.id,
        metric,
      });

      await logBadgeView(
        {
          badgeId: newBadge.id,
          timestamp: new Date(),
          utmParameters: {
            source: params?.utm_source,
            medium: params?.utm_medium,
            campaign: params?.utm_campaign,
            term: params?.utm_term,
            content: params?.utm_content,
          },
        },
        client
      );

      const rett = { raw: rawBadge, outdated: true };
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

async function logBadgeView(bv: BadgeView, client: Client) {
  const badgeView = await MigrationBadgeViewsRepository.New(client);
  const savepointId = "log_badge_view";
  try {
    await client.query(`SAVEPOINT ${savepointId};`);
    await badgeView.saveBadgeView(bv);
  } catch (e) {
    console.error(
      `[${opName}][logBadgeView] - Error logging new badge view.`,
      e
    );
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointId};`);
  }
}
