/**
 * Client for self-hosted WorkGraph FastAPI (Ollama + local ML).
 * Set WORKGRAPH_API_URL (server) or NEXT_PUBLIC_WORKGRAPH_API_URL (browser).
 */

import type { ATSFeedback, JobMatch, ParsedResume, WorkGraphHealth } from "../packages/shared/types/workgraph";

function baseUrl(): string {
  const url =
    (typeof window === "undefined"
      ? process.env.WORKGRAPH_API_URL
      : process.env.NEXT_PUBLIC_WORKGRAPH_API_URL) ??
    process.env.WORKGRAPH_API_URL ??
    process.env.NEXT_PUBLIC_WORKGRAPH_API_URL ??
    "http://localhost:8000";
  return url.replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WorkGraph API ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export function workgraphApiEnabled(): boolean {
  return Boolean(
    process.env.WORKGRAPH_API_URL ||
      process.env.NEXT_PUBLIC_WORKGRAPH_API_URL,
  );
}

export async function healthCheck(): Promise<WorkGraphHealth> {
  return apiFetch<WorkGraphHealth>("/health");
}

export async function parseResumeViaApi(
  file: File,
  options?: { userId?: string; store?: boolean },
): Promise<ParsedResume> {
  const form = new FormData();
  form.append("file", file);
  if (options?.userId) form.append("user_id", options.userId);
  if (options?.store) form.append("store", "true");
  return apiFetch<ParsedResume>("/resume/parse", { method: "POST", body: form });
}

export async function scoreAtsViaApi(
  resumeText: string,
  jobDescription: string,
  userId?: string,
): Promise<ATSFeedback> {
  return apiFetch<ATSFeedback>("/ats/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
      user_id: userId,
    }),
  });
}

export async function matchJobsViaApi(
  resumeText: string,
  topK = 20,
): Promise<{ matches: JobMatch[]; count: number }> {
  return apiFetch("/match/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, top_k: topK }),
  });
}
