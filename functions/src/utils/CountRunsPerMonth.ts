import ActionRun from "../domain/ActionRun.type";

/**
 * Averages the number of runs per months (including the current month)
 * @param {ActionRun[]} actionRuns array of all the action runs to consider
 * @return {number} rounded average of runs per month
 */
export default function CountRunsPerMonth(actionRuns: ActionRun[]): number {
  return average(Object.values(actionRuns
    .reduce((acc: { [k: string]: number }, cur: ActionRun) => {
      const d = new Date(Date.parse(cur.timestamp));
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      acc[key] = acc[key] ? acc[key] + 1 : 1;
      return acc;
    }, {})
  ));
}

/**
 * Rounded average
 * @param {number[]} array array of numbers to average out
 * @return {nmuber}
 */
function average(array: number[]): number {
  return Math.round(array.reduce((a: number, b: number) => a + b, 0) / array.length);
}

