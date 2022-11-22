export default function getBadgeStoragePath({
  creator,
  name,
  metric,
  fileExt = "svg",
}: {
  creator: string;
  name: string;
  metric: string;
  fileExt?: string;
}): string {
  return `${creator}/${name}/${metric}.${fileExt}`;
}
