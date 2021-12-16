import { PubSub } from "@google-cloud/pubsub";
import BadgeMetrics from "../domain/BadgeMetrics.type";
import BadgeRequestLogRepository from "../infrastructure/firestore/BadgeRequestLogRepository";
import BadgeStorage from "../infrastructure/storage/BadgeStorage";

type GetBadgeOperationParams = {
  owner: string,
  repo: string,
  metric: BadgeMetrics
}

export default async function GetBadgeOperation({ owner, repo, metric }: GetBadgeOperationParams)
  : Promise<string> {
  // send request to server to updated the badges
  const pubsub = new PubSub();
  const messageBuffer = Buffer.from(JSON.stringify({ owner, repo }), "utf8");
  await pubsub.topic("badges").publish(messageBuffer);

  const path = `${owner}/${repo}/${metric}`;
  const badge = await BadgeStorage.get(path);
  await BadgeRequestLogRepository.create({
    timestamp: new Date().toISOString(),
    creator: owner,
    name: repo,
    metric,
  });
  return badge;
}
