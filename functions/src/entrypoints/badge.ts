import * as functions from "firebase-functions";
import BadgeMetrics, { BadgeMetricsTypeValue } from "../domain/BadgeMetrics.type";
import GetBadgeOperation from "../operations/GetBadgeOperation";

async function getBadge(req: functions.Request, res: functions.Response) {
  const { owner, repo, metric } = req.query;
  if (owner === undefined || repo === undefined ||
    (metric !== undefined && !BadgeMetricsTypeValue.includes(metric.toString()))) {
    res.status(400);
    res.end();
    return;
  }

  const badge = await GetBadgeOperation({ owner: owner.toString(), repo: repo.toString(), metric: (metric as BadgeMetrics) });

  res.status(200);
  res.set("Content-Type", "image/svg+xml;charset=utf-8");
  res.send(badge);
  return;
}

export const badge = functions.https.onRequest(getBadge);
