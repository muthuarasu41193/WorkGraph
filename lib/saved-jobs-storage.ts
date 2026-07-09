const STORAGE_PREFIX = "wg-saved-catalog-jobs";

function keyForUser(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readSavedJobIds(userId: string): Set<string> {
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

export function writeSavedJobIds(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForUser(userId), JSON.stringify([...ids]));
}

export function toggleSavedJobId(userId: string, jobId: string): boolean {
  const next = readSavedJobIds(userId);
  const nowSaved = !next.has(jobId);
  if (nowSaved) next.add(jobId);
  else next.delete(jobId);
  writeSavedJobIds(userId, next);
  return nowSaved;
}

export function saveJobId(userId: string, jobId: string): void {
  const next = readSavedJobIds(userId);
  next.add(jobId);
  writeSavedJobIds(userId, next);
}
