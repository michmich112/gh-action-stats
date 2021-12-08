import * as functions from "firebase-functions";
import BadgeMetrics, { BadgeMetricsTypeValue } from "../domain/BadgeMetrics.type";
import CreateBadgeOperation from "../operations/CreateBadgeOperation";

async function getBadge(req: functions.Request, res: functions.Response) {
  const { owner, repo, metric } = req.params;
  if (owner === undefined || repo === undefined ||
    (metric !== undefined && !BadgeMetricsTypeValue.includes(metric))) {
    res.status(400);
    res.end();
    return;
  }

  const badge = CreateBadgeOperation({ owner, repo, metric: (metric as BadgeMetrics) });

  res.status(200);
  res.send(badge);
  return;
}

export const badge = functions.https.onRequest(getBadge);
