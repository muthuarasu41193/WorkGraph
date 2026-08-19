/** Owner download. Never a durable public Storage URL. */
export const OWNER_RESUME_FILE_PATH = "/api/resume/file";

const PUBLIC_RESUME_OBJECT_RE = /\/storage\/v1\/object\/public\/resumes\//i;

export function isPublicResumeObjectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return PUBLIC_RESUME_OBJECT_RE.test(url);
}

export function ownerResumeFilePath(): string {
  return OWNER_RESUME_FILE_PATH;
}

export function employerConnectionResumePath(connectionId: string): string {
  return `${OWNER_RESUME_FILE_PATH}?connectionId=${encodeURIComponent(connectionId)}`;
}

/** Employer UI must never open a stored public object URL. */
export function employerVisibleResumeHref(input: {
  connectionId: string;
  resumeUrl?: string | null;
}): string | null {
  if (!input.resumeUrl?.trim()) return null;
  return employerConnectionResumePath(input.connectionId);
}

/** Object keys must be `{ownerUserId}/…`. */
export function isOwnedResumeStoragePath(storagePath: string, ownerUserId: string): boolean {
  if (!storagePath || !ownerUserId) return false;
  if (storagePath.includes("..") || storagePath.startsWith("/")) return false;
  return storagePath.startsWith(`${ownerUserId}/`);
}

export function parseResumePathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/resumes/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split("?")[0] ?? "";
  return rest || null;
}

/** Profile-owned text only. Client-supplied resume_text is ignored. */
export function ownedResumeTextForMatch(profileText: string, _clientResumeText?: string | null): string {
  return profileText.trim();
}
