import * as functions from "firebase-functions";
import RefreshBadgesOperation from "../operations/RefreshBadgesOperation";

async function updateBadges(req: functions.Request, res: functions.Response) {
  const { owner, repo } = req.query;
  if (owner === undefined || repo === undefined) {
    res.status(400);
    res.end();
    return;
  }

  try {
    await RefreshBadgesOperation({ owner: owner.toString(), repo: repo.toString() });
    res.status(200);
    res.end();
  } catch (e) {
    console.group();
    console.error(`[updateBadges] - Error Refreshing Badges Operation for owner ${owner} and repo ${repo}`);
    console.error(e.message);
    console.error(e.stack);
    console.groupEnd();
    res.status(500);
    res.end();
  }
}

export const refreshBadges = functions.https.onRequest(updateBadges);


