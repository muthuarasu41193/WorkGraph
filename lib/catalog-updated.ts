/**
 * "Updated 12 min ago" from a real catalog timestamp.
 * Returns null when there is no usable timestamp so the UI can omit the line.
 */
export function formatCatalogUpdated(
  iso: string | null | undefined,
  now = Date.now(),
): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const delta = now - then;
  if (delta < 0) return null;
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Updated ${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}
