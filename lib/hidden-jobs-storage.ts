const STORAGE_PREFIX = "wg-hidden-jobs";

function keyForUser(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readHiddenJobIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(keyForUser(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function writeHiddenJobIds(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForUser(userId), JSON.stringify([...ids]));
}

export function hideJob(userId: string, jobId: string): Set<string> {
  const next = readHiddenJobIds(userId);
  next.add(jobId);
  writeHiddenJobIds(userId, next);
  return next;
}

export function restoreJob(userId: string, jobId: string): Set<string> {
  const next = readHiddenJobIds(userId);
  next.delete(jobId);
  writeHiddenJobIds(userId, next);
  return next;
}
