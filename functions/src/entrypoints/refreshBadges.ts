import * as functions from "firebase-functions";
import RefreshBadgesOperation from "../operations/RefreshBadgesOperation";

async function updateBadges(
  message: functions.pubsub.Message,
  context: functions.EventContext
) {
  const { owner, repo } = message.json;
  if (owner === undefined || repo === undefined) {
    console.error(
      `[Refresh Badges][BadMessage] - attempted to refresh badges for owner ${owner} and repo ${repo}`
    );
    return;
  }

  try {
    await RefreshBadgesOperation({
      owner: owner.toString(),
      repo: repo.toString(),
    });
  } catch (e: any) {
    console.group();
    console.error(
      `[updateBadges] - Error Refreshing Badges Operation for owner ${owner} and repo ${repo}`
    );
    console.error(e.message);
    console.error(e.stack);
    console.groupEnd();
  }
}

export const refreshBadges = functions.pubsub
  .topic("badges")
  .onPublish(updateBadges);
// export const refreshBadges = functions.https.onRequest(updateBadges);
