import ActionRun from "./ActionRun.type";

export type AttemptedActionRun = {
  run: ActionRun,
  reason: string,
}

export default AttemptedActionRun;

