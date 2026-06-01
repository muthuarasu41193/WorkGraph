const DEFAULT_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": process.env.HIDDEN_JOBS_USER_AGENT?.trim() || "WorkGraphHiddenJobs/1.0 (+https://workgraph.app)",
};

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { ...DEFAULT_HEADERS, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
