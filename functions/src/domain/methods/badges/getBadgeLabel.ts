export default function getBadgeLabel(metric: string): string {
  switch (metric) {
    case "runs":
      return "Runs";
    case "runs-per-month":
      return "Runs Per Month";
    case "repos":
      return "Repositories";
    default:
      return "Metric";
  }
}
