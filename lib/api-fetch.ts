import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "./upload-limits";

export { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL };

export function apiErrorMessage(data: unknown): string | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    return typeof err === "string" ? err : undefined;
  }
  return undefined;
}

/**
 * Parse JSON from an API response; detect CDN/HTML 404 pages that break static or misconfigured hosts.
 */
export async function readApiJson(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const looksLikeHosted404 =
      response.status === 404 ||
      /\bNOT_FOUND\b/i.test(raw) ||
      /the page could not be found/i.test(raw);
    if (looksLikeHosted404) {
      throw new Error(
        "Profile APIs were not found on this origin. Run the Next.js app (`npm run dev` or your Vercel deployment) and use /create-profile or /upload on that same URL—not Live Server or static hosting."
      );
    }
    const short = raw.slice(0, 140).replace(/\s+/g, " ").trim();
    throw new Error(
      short ? `Unexpected response from server: ${short}` : "Server returned non-JSON (check deployment and API routes)."
    );
  }
}
