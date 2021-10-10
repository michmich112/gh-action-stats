import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import Action from "../domain/Action.type";
import GetActionOperation from "../operations/GetActionOperation";


export async function getActionEntrypoint({ creator, action }: { creator: string, action: string }, context: CallableContext): Promise<Action> {
  if (!context?.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication Required');

  return await GetActionOperation({
    uid: context.auth!.uid,
    creator,
    action
  });

}

export const getAction = functions.https.onCall(getActionEntrypoint);

