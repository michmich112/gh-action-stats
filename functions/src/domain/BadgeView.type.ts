export type UtmParameters = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type BadgeView = {
  badgeId: number;
  timestamp: Date;
  utmParameters: UtmParameters;
};

export default BadgeView;
