import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import GetActionForUserOperation from "../operations/GetActionsForUser";
import Action from "../domain/Action.type";

export async function getActionsEntrypoint(_: any, context: CallableContext): Promise<Action[]> {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');

  return await GetActionForUserOperation(context.auth.uid);
}

export const getAction = functions.https.onCall(getActionsEntrypoint);

