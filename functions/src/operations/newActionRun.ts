import {ActionRun} from "../domain/ActionRun.type";
import {isGithubActionsAddress} from "../utils/githubUtils";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import AttemptedActionRunRepository from "../infrastructure/firestore/AttemptedActionRunRepository";

/**
 * Operation to register a new run of an action
 * @param {ActionRun} runData
 * @return {Promise<void>}
 * @constructor
 */
async function NewActionRunOperation(runData: ActionRun): Promise<void> {
  const {ip} = runData;
  if (await isGithubActionsAddress(ip)) {
    try {
      await ActionRunRepository.create(runData);
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
    } catch (e) {
      console.error("Error saving attempted-run to firestore", e);
    }
  }
}

export default NewActionRunOperation;

