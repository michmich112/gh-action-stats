import * as functions from "firebase-functions";
import { firestore } from "./config/firebase.config";
import { ActionRun } from "./types";
import { isGithubActionsAddress } from "./utils/githubUtils";

export const newActionRun = functions.https
  .onRequest(async (req: functions.Request, res: functions.Response) => {
    const { method, body, ip } = req;
    if (method !== "POST") {
      res.status(405);
      res.end();
      return;
    }
    const data: ActionRun = {
      ip,
      ...body,
      timestamp: new Date().toISOString(),
    };
    res.status(200);
    res.end();
    if (await isGithubActionsAddress(ip)) {
      try {
        await firestore.collection("runs").add(data);
      } catch (e) {
        console.error("Error saving run to firestore.", e);
      }
    } else {
      const message = `Attempted insertion from Non-Github IP: ${ip}`;
      console.warn(message);
      try {
        await firestore.collection("attempted-runs").add({
          data,
          reason: message
        });
      } catch (e) {
        console.error("Error saving attempted-run to firestore", e);
      }
    }

  });

