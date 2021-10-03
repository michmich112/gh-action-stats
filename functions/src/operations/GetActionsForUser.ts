import Action from "../domain/Action.type";
import UserRepository from "../infrastructure/firestore/UserRepository";
import ActionsRepository from "../infrastructure/firestore/ActionsRepository";

async function GetActionsForUserOperation(uid: string): Promise<Action[]> {
  const user = await UserRepository.getByUid(uid);
  if (user !== null) {
    return ActionsRepository.getActionsByCreator(user.username);
  } else {
    console.warn(`[GetActionForUserOperation] - User not found for uid ${uid}`);
    return [];
  }
}

export default GetActionsForUserOperation;

