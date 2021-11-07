import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import ActionRunReturn from "../domain/ActionRunReturn.type";
import GetActionRunsOperation from "../operations/GetActionRunsOperation";

export async function getActionRunsEntrypoint({ action, creator }: { action: string, creator: string }, context: CallableContext): Promise<ActionRunReturn[]> {
  if (!context?.auth?.uid) throw new functions.https.HttpsError("unauthenticated", "Authentication Required");

  return await GetActionRunsOperation({
    uid: context.auth!.uid,
    name: action,
    creator,
  });
}

export const getActionRuns = functions.https.onCall(getActionRunsEntrypoint);

