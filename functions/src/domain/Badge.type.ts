import BadgeMetrics from "./BadgeMetrics.type";

interface Badge extends BadgeData {
  id: number;
}

export interface BadgeData {
  actionId: number;
  metric: BadgeMetrics;
  lastGenerated: Date;
  locationPath: string;
  publicUri: string;
  value: string;
}

export default Badge;
