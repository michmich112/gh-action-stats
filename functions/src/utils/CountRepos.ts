import ActionRun from "../domain/ActionRun.type";

/**
 * Counts the individual number of repositories that have run the action
 * @param {ActionRun[]} actionRuns:  runs to be considered when counting
 * @returns {number}
 */
export default function CountRepos(actionRuns: ActionRun[]): number {
  return actionRuns.reduce((acc: Set<string>, cur: ActionRun) =>
    (cur.github_repository ? acc.add(cur.github_repository) : acc), new Set()
  ).size;
}

