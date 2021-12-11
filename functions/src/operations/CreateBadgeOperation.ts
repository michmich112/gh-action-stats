import BadgeMetrics from "../domain/BadgeMetrics.type";
import BadgeRequestLogRepository from "../infrastructure/firestore/BadgeRequestLogRepository";
import BadgeStorage from "../infrastructure/storage/BadgeStorage";
import axios from "axios";

type CreateBadgeOperationParams = {
  owner: string,
  repo: string,
  metric: BadgeMetrics
}

export default async function CreateBadgeOperation({ owner, repo, metric }: CreateBadgeOperationParams)
  : Promise<string> {
  // send request to server to updated the badges
  axios.get("https://actions.boringday.co/api/badge/refresh", { params: { owner, repo } });
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
