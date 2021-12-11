import BadgeMetrics, { BadgeMetricsTypeValue } from "../domain/BadgeMetrics.type";
import { makeBadge } from "badge-maker";
import ActionRepository from "../infrastructure/firestore/ActionsRepository";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import BadgeStorage from "../infrastructure/storage/BadgeStorage";
import ActionRun from "../domain/ActionRun.type";
import CountRuns from "../utils/CountRuns";
import CountRunsPerMonth from "../utils/CountRunsPerMonth";
import CountRepos from "../utils/CountRepos";

type RefreshBadgesOperationParams = {
  owner: string,
  repo: string,
}

export default async function RefreshBadgesOperation({ owner, repo }: RefreshBadgesOperationParams)
  : Promise<void> {
  const action = await ActionRepository.getActionByCreatorAndName(owner, repo);
  if (action !== null &&
    (action.badges === undefined ||
      action.badges.is_updating === undefined ||
      action.badges.last_update === undefined)) {
    await ActionRepository.setBadgesIsUpdating(owner, repo, true);
    await ActionRepository.setBadgesLastUpdate(owner, repo, new Date(0));
  }

  if (action === null || action.badges === undefined || (new Date().getTime() - action.badges.last_update.getTime()) < 60000 || action.badges.is_updating) {
    // do not do anything since action may not exist, it may have alraedy been updated in the last minute or is currently updating
    return;
  }
  await ActionRepository.setBadgesIsUpdating(owner, repo, true);
  // update badges update time
  try {
    const actionRuns: ActionRun[] = await ActionRunRepository.getByCreatorAndName(owner, repo);
    await Promise.all(BadgeMetricsTypeValue
      .map((metric: string) => UpdateBadge({
        actionRuns,
        owner,
        repo,
        metric: metric as BadgeMetrics,
      })
      )
    );
    await ActionRepository.setBadgesLastUpdate(owner, repo, new Date());
    await ActionRepository.setBadgesIsUpdating(owner, repo, false);
  } catch (e) {
    console.group();
    console.error(`[RefreshBadgesOperation] Error updating Badges for owner: ${owner} and repo ${repo}`);
    console.error(e.message);
    console.error(e.stack);
    console.groupEnd();
    await ActionRepository.setBadgesIsUpdating(owner, repo, false);
  }
}

type UpdateBadgeParams = {
  actionRuns: ActionRun[],
  owner: string,
  repo: string,
  metric: BadgeMetrics,
}

async function UpdateBadge({ actionRuns, owner, repo, metric }: UpdateBadgeParams) {
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

  const format = {
    label,
    color: "green",
    message: value.toString(),
  };

  const badge = makeBadge(format);
  const path = `${owner}/${repo}/${metric}`;

  // save badge to storage
  await BadgeStorage.put(path, badge);
}

