import axios from "axios";
import * as functions from "firebase-functions";
import ActionRun from "../domain/ActionRun.type";
import ActionRunRepository from "../infrastructure/postgres/ActionRunRepository";
import { createClient } from "../infrastructure/postgres/PostgresClient";

async function SyncActionRun(
  message: functions.pubsub.Message,
  context: functions.EventContext
) {
  const actionRun: ActionRun = message.json?.actionRun;
  if (actionRun === undefined) {
    console.error(
      "[SyncActionRun][BadMessage] - could not access actionRun data."
    );
    return;
  }

  try {
    if (!process.env.V2_ENDPOINT) {
      console.error("No V2_ENDPOINT env variable set");
    } else {
      const res = await axios.post(process.env.V2_ENDPOINT, actionRun);
      console.log("V2 Sync return:", res);
    }
  } catch (e) {
    console.error("Error synching run to V2", e);
  }

  const client = createClient();

  try {
    await client.connect(); // connect clinent
    const actionRunRepository = new ActionRunRepository(client);
    await actionRunRepository.create(actionRun);
  } catch (e: any) {
    console.group();
    console.error(
      "[SyncActionRun] - Error connecting & adding an action run to the repository"
    );
    console.error(e.message);
    console.error(e.stack);
    console.groupEnd();
  } finally {
    // make sure to close the client connection at the end
    await client.end();
  }
}

export const syncActionRun = functions.pubsub
  .topic("action-runs")
  .onPublish(SyncActionRun);
