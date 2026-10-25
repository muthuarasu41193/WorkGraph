import { isOwnedResumeStoragePath } from "@/lib/security/resume-access";

const SECRET_KEY = /(token|secret|password|api[_-]?key|service[_-]?role)/i;

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function sanitizeExportString(value: string, userId: string): string {
  const storageUrl =
    /(?:https?:\/\/[^\s"'<>]*)?\/storage\/v1\/object\/(?:sign|public)\/(?:resumes|avatars)\/([^?\s"'<>]+)(?:\?[^\s"'<>]*)?/gi;
  return value.replace(storageUrl, (_full, rawPath: string) => {
    const path = decodePath(rawPath);
    return isOwnedResumeStoragePath(path, userId) ? path : "";
  });
}

export function sanitizeExportValue(value: unknown, userId: string): unknown {
  if (typeof value === "string") return sanitizeExportString(value, userId);
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeExportValue(item, userId));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) continue;
      output[key] = sanitizeExportValue(child, userId);
    }
    return output;
  }
  return null;
}
