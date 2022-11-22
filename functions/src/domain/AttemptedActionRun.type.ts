import ActionRun from "./ActionRun.type";

export type AttemptedActionRun = {
  run: ActionRun;
  reason: string;
};

export type MigrationAttemptedRun = {
  id: number;
  reason: string;
};

export default AttemptedActionRun;
