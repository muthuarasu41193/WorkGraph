const STORAGE_PREFIX = "wg-hidden-discovery-saves";

function key(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readSavedOpportunityIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function writeSavedOpportunityIds(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(userId), JSON.stringify([...ids]));
}

export function toggleSavedOpportunity(userId: string, opportunityId: string): boolean {
  const next = readSavedOpportunityIds(userId);
  const nowSaved = !next.has(opportunityId);
  if (nowSaved) next.add(opportunityId);
  else next.delete(opportunityId);
  writeSavedOpportunityIds(userId, next);
  return nowSaved;
}
