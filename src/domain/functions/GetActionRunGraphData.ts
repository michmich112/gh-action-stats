import type ActionRun from "../types/ActionRun";

/**
 * Transform raw data into data for graphing number of runs on specific day
 */
export default function getActionRunGraphData(data: ActionRun[]): { labels: string[], data: number[] } {
  if (data.length < 1) return { labels: [], data: [] }
  const sortedData = data.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const labels = getDaysBetweenDates(dateFromTimestamp(sortedData[0].timestamp),
    dateFromTimestamp(sortedData[sortedData.length - 1].timestamp))
    .map(fmtDate);
  const retData = [... new Array(labels.length)].map(_ => 0);
  sortedData.forEach(e => {
    const index = labels.indexOf(fmtDate(dateFromTimestamp(e.timestamp)));
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
  const labels = getDaysBetweenDates(dateFromTimestamp(sortedData[0].timestamp),
    dateFromTimestamp(sortedData[sortedData.length - 1].timestamp))
    .map(fmtDate);
  const retData: Set<string>[] = [... new Array(labels.length)].map(_ => new Set());
  sortedData.forEach(e => {
    const index = labels.indexOf(fmtDate(dateFromTimestamp(e.timestamp)));
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
  const labels = getDaysBetweenDates(dateFromTimestamp(sortedData[0].timestamp),
    dateFromTimestamp(sortedData[sortedData.length - 1].timestamp))
    .map(fmtDate);
  const retData: Set<string>[] = [... new Array(labels.length)].map(_ => new Set());
  sortedData.forEach(e => {
    const index = labels.indexOf(fmtDate(dateFromTimestamp(e.timestamp)));
    retData[index].add(e.actor);
  });
  return {
    labels,
    data: retData.map(v => v.size),
  }
}

/**
 * Memoization functioen to offload possibly expensive computaion
 */
const memoize = (func: (...args: any[]) => any) => {
  const results = {};
  return (...args: any[]) => {
    const argsKey = JSON.stringify(args);
    if (!results[argsKey]) {
      results[argsKey] = func(...args);
    }
    return results[argsKey];
  }
}

/**
 * This computation can be expensive depending on the size of the dataset so we memoize it
 * Get the days between two dates
 */
export const getDaysBetweenDates = memoize((start: Date, end: Date): Date[] => {
  if (start.getTime() > end.getTime()) return [];
  const days = [];
  const dayInMs = 24 * 60 * 60 * 1000;
  const endDate = new Date(end.getTime() + dayInMs).toLocaleDateString();
  let day = start;
  while (day.toLocaleDateString() !== endDate) {
    days.push(new Date(day.toLocaleDateString()));
    day.setTime(day.getTime() + dayInMs);
  }
  return days.map(d => {
    d.setTime(d.getTime() - (d.getTime() % dayInMs) + dayInMs)
    return d;
  });
});

function dateFromTimestamp(timestamp: string): Date {
  return new Date(Date.parse(timestamp));
}
function fmtDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date);
}
