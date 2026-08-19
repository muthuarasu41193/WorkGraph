/** Server diagnostics without secrets, tokens, or resume/PII payloads. */
export function logRouteError(route: string, error: unknown): void {
  const name = error instanceof Error ? error.name : "Error";
  console.error(`[${route}] ${name}`);
}
