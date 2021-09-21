import * as functions from "firebase-functions";
import ActionRun from "../domain/ActionRun.type";
import NewActionRunOperation from "../operations/newActionRun";

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
    res.status(200);
    res.end();
    // eslint-disable-next-line new-cap
    await NewActionRunOperation(data);
  });

