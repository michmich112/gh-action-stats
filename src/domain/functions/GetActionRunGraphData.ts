import type ActionRun from "../types/ActionRun";

/**
 * Transform raw data into data for graphing number of runs on specific day
 */
export default function getActionRunGraphData(data: ActionRun[]): { labels: string[], data: number[] } {
  if (data.length < 1) return { labels: [], data: [] }
  const sortedData = data.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const labels = getDateRangeWithSeperation(new Date(Date.parse(sortedData[0].timestamp)),
    new Date(Date.parse(sortedData[sortedData.length - 1].timestamp)));
  const retData = [... new Array(labels.length)].map(_ => 0);
  sortedData.forEach(e => {
    const index = labels.indexOf(new Date(Date.parse(e.timestamp)).toLocaleDateString());
    retData[index] += 1;
  });
  return {
    labels,
    data: retData,
  }
}

/**
 * Transform raw data into data for graphing number of unique repos for specific day
 */
export function getActionReposGraphData(data: ActionRun[]): { labels: string[], data: number[] } {
  if (data.length < 1) return { labels: [], data: [] };
  const sortedData = data.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const labels = getDateRangeWithSeperation(new Date(Date.parse(sortedData[0].timestamp)),
    new Date(Date.parse(sortedData[sortedData.length - 1].timestamp)));
  const retData: Set<string>[] = [... new Array(labels.length)].map(_ => new Set());
  sortedData.forEach(e => {
    const index = labels.indexOf(new Date(Date.parse(e.timestamp)).toLocaleDateString());
    retData[index].add(e.repository);
  });
  return {
    labels,
    data: retData.map(v => v.size),
  }
}

/**
 * Transform raw data into data for graphing number of unique actors for specific day
 */
export function getActionActorsGraphData(data: ActionRun[]): { labels: string[], data: number[] } {
  if (data.length < 1) return { labels: [], data: [] };
  const sortedData = data.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const labels = getDateRangeWithSeperation(new Date(Date.parse(sortedData[0].timestamp)),
    new Date(Date.parse(sortedData[sortedData.length - 1].timestamp)));
  const retData: Set<string>[] = [... new Array(labels.length)].map(_ => new Set());
  sortedData.forEach(e => {
    const index = labels.indexOf(new Date(Date.parse(e.timestamp)).toLocaleDateString());
    retData[index].add(e.actor);
  });
  return {
    labels,
    data: retData.map(v => v.size),
  }
}

function getDateRangeWithSeperation(start: Date, end: Date, deltaMs: number = 86400000, toStringFn: string = "toLocaleDateString") {
  const days: string[] = [];
  let date = start;
  while (date <= end) {
    days.push(date[toStringFn]());
    date = new Date(date.getTime() + deltaMs);
  }

  days.push(end[toStringFn]());
  return days;
}

