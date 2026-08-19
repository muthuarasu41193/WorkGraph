/**
 * Server-side identity for P0 API routes.
 * Client-supplied user ids are never an authentication source.
 */

export type SessionIdentity = {
  id: string;
};

/** Session user wins. A client user_id is ignored even when present and well-formed. */
export function resolveAuthenticatedUserId(
  sessionUser: SessionIdentity | null | undefined,
  _clientUserId?: string | null,
): string | null {
  return sessionUser?.id ?? null;
}

export function unauthenticatedStatus(sessionUserId: string | null): 401 | null {
  return sessionUserId ? null : 401;
}

export function matchJobsAccess(
  sessionUserId: string | null,
  apiEnabled: boolean,
): { status: 401 } | { status: 503 } | { status: 200; userId: string } {
  if (!sessionUserId) return { status: 401 };
  if (!apiEnabled) return { status: 503 };
  return { status: 200, userId: sessionUserId };
}
