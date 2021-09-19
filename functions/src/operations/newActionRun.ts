import { ActionRun } from "../domain/ActionRun.type";
import { isGithubActionsAddress } from "../utils/githubUtils";
import ActionRunRepository from "../infrastructure/firestore/ActionRunRepository";
import AttemptedActionRunRepository from "../infrastructure/firestore/AttemptedActionRunRepository";

async function NewActionRunOperation(runData: ActionRun) {
  const { ip } = runData;
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
        reason: message
      });
    } catch (e) {
      console.error("Error saving attempted-run to firestore", e);
    }
  }
}

export default NewActionRunOperation;

