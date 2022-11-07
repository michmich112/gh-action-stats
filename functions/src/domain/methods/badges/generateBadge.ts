import { makeBadge } from "badge-maker";

type badgeDefinition = {
  label: string;
  color?: string;
  value: string;
};

export default function generateBadge(config: badgeDefinition): string {
  return makeBadge({
    label: config.label,
    color: config.color ?? "green",
    message: config.value,
  });
}
