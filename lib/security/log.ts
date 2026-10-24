/** Server diagnostics without secrets, tokens, or resume/PII payloads. */
export function logRouteError(route: string, error: unknown): void {
  const name = error instanceof Error ? error.name : "Error";
  console.error(`[${route}] ${name}`);
}

const ERROR_CODES = new Set([
  "entitlement_unavailable",
  "usage_count_failed",
  "usage_record_failed",
]);

/**
 * Log a stable error code. Anything outside the allow-list is replaced so a
 * message, email, or resume fragment cannot reach the log line.
 */
export function logErrorCode(route: string, code: string): void {
  const safeRoute = /^[\w./-]{1,80}$/.test(route) ? route : "app";
  const safeCode = ERROR_CODES.has(code) ? code : "unknown_error";
  console.error(`[${safeRoute}] ${safeCode}`);
}
