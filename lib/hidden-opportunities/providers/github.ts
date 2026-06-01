import { fetchJson } from "../http";
import { scoreOpportunity } from "../ranking";
import type { HiddenOpportunity } from "../types";

const SEARCH_QUERIES = [
  "hiring in:title,body",
  '"job opening" in:title,body',
  '"looking for engineer" in:title,body',
  '"remote role" in:title,body',
] as const;

type GitHubSearchItem = {
  id?: number;
  title?: string;
  html_url?: string;
  created_at?: string;
  user?: { login?: string };
  repository_url?: string;
};

type GitHubSearchResponse = {
  items?: GitHubSearchItem[];
  message?: string;
};

function repoNameFromUrl(repositoryUrl?: string): string | undefined {
  if (!repositoryUrl) return undefined;
  const match = repositoryUrl.match(/repos\/([^/]+\/[^/]+)/i);
  return match?.[1];
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.HIDDEN_GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function searchGitHub(
  query: string,
  type: "issue" | "discussion",
): Promise<GitHubSearchItem[]> {
  const perPage = Math.min(
    Math.max(Number.parseInt(process.env.HIDDEN_GITHUB_PER_QUERY || "15", 10) || 15, 5),
    30,
  );
  const params = new URLSearchParams({
    q: `${query} type:${type}`,
    sort: "created",
    order: "desc",
    per_page: String(perPage),
  });

  const payload = await fetchJson<GitHubSearchResponse>(
    `https://api.github.com/search/${type === "issue" ? "issues" : "discussions"}?${params}`,
    { headers: githubHeaders(), timeoutMs: 15_000 },
  );

  if (payload.message) {
    throw new Error(payload.message);
  }

  return payload.items ?? [];
}

export async function fetchGitHubOpportunities(): Promise<HiddenOpportunity[]> {
  const seen = new Set<string>();
  const results: HiddenOpportunity[] = [];

  for (const query of SEARCH_QUERIES) {
    for (const kind of ["issue", "discussion"] as const) {
      let items: GitHubSearchItem[];
      try {
        items = await searchGitHub(query, kind);
      } catch (err) {
        if (kind === "discussion") continue;
        const message = err instanceof Error ? err.message : String(err);
        if (/not found|404/i.test(message)) continue;
        throw new Error(`GitHub search failed for query: ${query}`);
      }

      for (const item of items) {
        const id = item.id;
        const title = item.title?.trim();
        const url = item.html_url?.trim();
        if (!id || !title || !url) continue;

        const key = `github:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const repo = repoNameFromUrl(item.repository_url);

        results.push(
          scoreOpportunity({
            id: key,
            source: "github",
            title,
            url,
            company: repo,
            location: undefined,
            author: item.user?.login ? `@${item.user.login}` : undefined,
            postedAt: item.created_at || new Date().toISOString(),
            category: kind,
            tags: ["github", kind],
          }),
        );
      }
    }
  }

  return results;
}
