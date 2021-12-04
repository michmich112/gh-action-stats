import ActionRunReturn from "../domain/ActionRunReturn.type";
import UserRepository from "../infrastructure/firestore/UserRepository";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import { isRepoAccessible } from "../infrastructure/github/GitHubUserApi";
import * as functions from "firebase-functions";
import ActionRun from "../domain/ActionRun.type";

type GetActionRunsOperationParams = {
  uid: string;
  creator: string,
  token: string,
  name: string,
}


function HashRepo(repo: string): string {
  const owner = repo.split('/')[0];
  const repoName = repo.split('/').slice(1).join('/');
  let hash = 0, i, chr;
  for (i = 0; i < repoName.length; i++) {
    chr = repoName.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return `${owner}/${hash}`;
}

async function GetActionRunsOperation({ uid, creator, name, token }: GetActionRunsOperationParams)
  : Promise<ActionRunReturn[]> {
  const user = await UserRepository.getByUid(uid);
  if (user !== null && user.username !== creator) {
    throw new functions.https.HttpsError("permission-denied", "Resource Forbidden.");
  }
  const actionRuns = await ActionRunRepository.getByCreatorAndName(creator, name);
  const repos = [...actionRuns.reduce((acc: Set<string>, cur: ActionRun) =>
    cur.github_repository ? acc.add(cur.github_repository) : acc, new Set())];
  const reposRename = (await Promise.all(repos.map(async (r) => {
    const ira = await isRepoAccessible(token, r.split('/')[0], r.split('/').slice(1).join('/'));
    return ira ? undefined : r;
  })))
    .reduce((acc: { [k: string]: string }, cur?: string) => (cur !== undefined ? { ...acc, [cur]: HashRepo(cur) } : acc), {});



  return actionRuns.map((ar) => {
    const repoName = ar.github_repository ? reposRename[ar.github_repository] : undefined;
    return {
      actor: ar.github_actor || "",
      ip: ar.ip,
      os: ar.runner_os,
      timestamp: ar.timestamp,
      repository: repoName ?? ar.github_repository,
      event: ar.github_event_name || null,
      execution_time: ar.execution_time || null,
      error: ar.error || null,
      is_private: repoName !== undefined, // if we have to rename it then its private
    } as ActionRunReturn
  });
}

export default GetActionRunsOperation;
