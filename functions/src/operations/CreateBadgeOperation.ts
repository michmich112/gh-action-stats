import BadgeMetrics from "../domain/BadgeMetrics.type";
import { makeBadge, Format } from "badge-maker";
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

export default async function CreateBadgeOperation({ owner, repo, metric }: CreateBadgeOperationParams): Promise<string> {
  const actionRuns: ActionRun[] = await ActionRunRepository.getByCreatorAndName(owner, repo);
  let value = 0;
  switch (metric) {
    case "runs":
      value = CountRuns(actionRuns);
    case "runs/month":
      value = CountRunsPerMonth(actionRuns);
    case "repos":
      value = CountRepos(actionRuns);
  }

  const format = {
    label: metric,
    color: "green",
    message: value.toString()
  }

  return makeBadge(format);
}
