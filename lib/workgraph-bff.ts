/**
 * Server-side proxy to WorkGraph FastAPI with authenticated user context.
 */

import { forwardAuthHeaders } from "./auth/session-server";
import { workgraphApiEnabled } from "./workgraph-api";

function apiBase(): string {
  const url = process.env.WORKGRAPH_API_URL ?? process.env.NEXT_PUBLIC_WORKGRAPH_API_URL;
  if (!url) throw new Error("WORKGRAPH_API_URL is not configured");
  return url.replace(/\/$/, "");
}

export async function workgraphBffFetch<T>(
  path: string,
  init?: RequestInit & { request?: Request },
): Promise<T> {
  if (!workgraphApiEnabled()) {
    throw new Error("WorkGraph API is not configured");
  }

  const authHeaders = init?.request ? await forwardAuthHeaders(init.request) : await forwardAuthHeaders();

  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...authHeaders,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WorkGraph BFF ${path}: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}
