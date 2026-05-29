/** Prefer self-hosted WorkGraph API proxies when configured. */

export function workgraphRoutesEnabled(): boolean {
  return Boolean(
    process.env.WORKGRAPH_API_URL ||
      process.env.NEXT_PUBLIC_WORKGRAPH_API_URL,
  );
}

export function parseResumePath(): string {
  return workgraphRoutesEnabled() ? "/api/v2/parse-resume" : "/api/parse-resume";
}

export function atsScorePath(): string {
  return workgraphRoutesEnabled() ? "/api/v2/ats-score" : "/api/ats-score";
}

export function matchJobsPath(): string {
  return "/api/v2/match-jobs";
}
