import Action from "../domain/Action.type";
import UserRepository from "../infrastructure/firestore/UserRepository";
import ActionsRepository from "../infrastructure/firestore/ActionsRepository";
// Note an error should be created in the domain layer and mapped in the interface layer 
// instead of importing firebase-functions here as it does not make this code infrastructure agnostic
// TODO: Next refactor - Properly do errors
import * as functions from "firebase-functions";

type GetActionOperationParams = {
  uid: string;      // user UID
  creator: string;  // action creator's username
  action: string;
}

async function GetActionOperation({ uid, creator, action }: GetActionOperationParams): Promise<Action> {
  const user = await UserRepository.getByUid(uid);
  if (user !== null && user.username !== creator) throw new functions.https.HttpsError('permission-denied', 'Resource Forbidden.');
  const actionData = await ActionsRepository.getActionByCreatorAndName(creator, action);
  if (actionData === null) throw new functions.https.HttpsError('not-found', 'Action not found');
  return actionData;
};

export default GetActionOperation;

