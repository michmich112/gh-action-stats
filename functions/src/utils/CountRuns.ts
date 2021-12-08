import ActionRun from "../domain/ActionRun.type";

export default function CountRuns(actionRuns: ActionRun[]): number {
  return actionRuns.length;
}

