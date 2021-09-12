import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


admin.initializeApp();

export const newActionRun = functions.https
  .onRequest(async (req: functions.Request, res: functions.Response) => {
    const { method, body, ip } = req;
    if (method !== "POST") {
      res.status(405);
      res.end();
      return;
    }
    const data = {
      ip,
      ...body,
      timestamp: new Date().toISOString(),
    };
    try {
      await admin.firestore().collection("runs").add(data);
      res.status(200);
    } catch (e) {
      console.error("Error saving run to firestore.", e);
      res.status(500);
    }
    res.end();
  });

