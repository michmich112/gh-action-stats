import BadgeMetrics from "../domain/BadgeMetrics.type";
import BadgeRequestLogRepository from "../infrastructure/firestore/BadgeRequestLogRepository";
import { makeBadge } from "badge-maker";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import ActionRun from "../domain/ActionRun.type";
import CountRuns from "../utils/CountRuns";
import CountRunsPerMonth from "../utils/CountRunsPerMonth";
import CountRepos from "../utils/CountRepos";

type CreateBadgeOperationParams = {
  owner: string,
  repo: string,
  metric: BadgeMetrics
}

export default async function CreateBadgeOperation({ owner, repo, metric }: CreateBadgeOperationParams)
  : Promise<string> {
  const actionRuns: ActionRun[] = await ActionRunRepository.getByCreatorAndName(owner, repo);
  let label: string;
  let value = 0;
  switch (metric) {
    case "runs":
      label = "Total runs";
      value = CountRuns(actionRuns);
      break;
    case "runs-per-month":
      label = "Runs/Month";
      value = CountRunsPerMonth(actionRuns);
      break;
    case "repos":
      label = "Number of Repos";
      value = CountRepos(actionRuns);
  }

  await BadgeRequestLogRepository.create({
    timestamp: new Date().toISOString(),
    creator: owner,
    name: repo,
    metric,
  });

  const format = {
    label,
    color: "green",
    message: value.toString(),
  };

  return makeBadge(format);
}
