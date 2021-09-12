import * as functions from "firebase-functions";
import {firestore} from "./config/firebase.config";
import {ActionRun} from "./types";

export const newActionRun = functions.https
  .onRequest(async (req: functions.Request, res: functions.Response) => {
    const {method, body, ip} = req;
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
    try {
      await firestore.collection("runs").add(data);
      res.status(200);
    } catch (e) {
      console.error("Error saving run to firestore.", e);
      res.status(500);
    }
    res.end();
  });

