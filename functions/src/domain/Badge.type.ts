import BadgeMetrics from "./BadgeMetrics.type";

type Badge = {
  actionId: number;
  metric: BadgeMetrics;
  lastGenerated: Date;
  locationPath: string;
  publicUri: string;
};

export default Badge;
