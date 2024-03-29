import { ActionRun } from "../domain/ActionRun.type";
import { isGithubActionsAddress } from "../utils/githubUtils";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import ActionRepository from "../infrastructure/firestore/ActionsRepository";
import AttemptedActionRunRepository from "../infrastructure/firestore/AttemptedActionRunRepository";
import { PubSub } from "@google-cloud/pubsub";

/**
 * Operation to register a new run of an action
 * @param {ActionRun} runData
 * @return {Promise<void>}
 * @constructor
 */
async function NewActionRunOperation(runData: ActionRun): Promise<void> {
  const { creator, name, ip } = runData;
  if (await isGithubActionsAddress(ip)) {
    try {
      await ActionRunRepository.create(runData);
      await ActionRepository.add({
        creator,
        name,
        last_update: new Date(),
      });
      /* START SYNC */
      const ps = new PubSub();
      try {
        await ps
          .topic("action-runs")
          .publishMessage({ json: { actionRun: runData } });
      } catch (e) {
        console.error("Error synching new action run to pubSub Queue.", e);
      }
      /* END SYNC */
    } catch (e) {
      console.error("Error saving run to firestore.", e);
    }
  } else {
    const message = `Attempted insertion from Non-Github IP: ${ip}`;
    console.warn(message);
    try {
      await AttemptedActionRunRepository.create({
        run: runData,
        reason: message,
      });
      await ActionRepository.add({
        creator,
        name,
        last_update: new Date(),
      });
    } catch (e) {
      console.error("Error saving attempted-run to firestore", e);
    }
  }
}

export default NewActionRunOperation;
