export const ACCOUNT_DELETE_CONFIRMATION = "DELETE";

export const ACCOUNT_EXPORT_LIMIT = 5;
export const ACCOUNT_DELETE_LIMIT = 10;
export const ACCOUNT_RATE_WINDOW_MS = 60 * 60 * 1000;

export const SIGN_IN_REQUIRED = "Sign in required.";
export const DELETE_CONFIRMATION_REQUIRED = "Type DELETE to confirm account deletion.";
export const ACCOUNT_UNAVAILABLE = "Account tools are unavailable.";
export const ACCOUNT_EXPORT_FAILED = "Could not prepare your download. You can try again.";
export const ACCOUNT_DELETE_FAILED = "Could not delete your account. You can try again.";
export const ACCOUNT_EXPORT_RATE_LIMITED =
  "You can download your data a few times per hour. Try again later.";
export const ACCOUNT_DELETE_RATE_LIMITED = "Too many deletion attempts. Try again later.";

export const ACCOUNT_DELETED_REDIRECT = "/?accountDeleted=1";
export const ACCOUNT_EXPORT_FILENAME = "workgraph-account-export.json";

export const ACCOUNT_PUBLIC_ERRORS = new Set([
  SIGN_IN_REQUIRED,
  DELETE_CONFIRMATION_REQUIRED,
  ACCOUNT_UNAVAILABLE,
  ACCOUNT_EXPORT_FAILED,
  ACCOUNT_DELETE_FAILED,
  ACCOUNT_EXPORT_RATE_LIMITED,
  ACCOUNT_DELETE_RATE_LIMITED,
]);

export function publicAccountError(value: unknown, fallback: string): string {
  return typeof value === "string" && ACCOUNT_PUBLIC_ERRORS.has(value) ? value : fallback;
}

export function parseDeleteConfirmation(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const confirmation = (body as { confirmation?: unknown }).confirmation;
  return confirmation === ACCOUNT_DELETE_CONFIRMATION;
}
