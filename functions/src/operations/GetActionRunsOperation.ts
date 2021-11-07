import ActionRunReturn from "../domain/ActionRunReturn.type";
import UserRepository from "../infrastructure/firestore/UserRepository";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import * as functions from "firebase-functions";

type GetActionRunsOperationParams = {
  uid: string;
  creator: string,
  name: string,
}

async function GetActionRunsOperation({ uid, creator, name }: GetActionRunsOperationParams): Promise<ActionRunReturn[]> {
  const user = await UserRepository.getByUid(uid);
  if (user !== null && user.username !== creator) throw new functions.https.HttpsError('permission-denied', 'Resource Forbidden.');
  const actionRuns = await ActionRunRepository.getByCreatorAndName(creator, name);
  return actionRuns.map(ar => ({
    actor: ar.github_actor || "",
    ip: ar.ip,
    os: ar.runner_os,
    timestamp: ar.timestamp,
    repository: ar.github_repository,
    is_private: false
  }) as ActionRunReturn);
}

export default GetActionRunsOperation;

