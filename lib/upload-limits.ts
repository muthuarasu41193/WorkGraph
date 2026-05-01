/**
 * Vercel serverless request bodies are capped around 4.5 MB; staying at 4 MB avoids hard failures.
 * Keep client max upload and server checks in sync with this constant.
 */
export const MAX_RESUME_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_RESUME_UPLOAD_LABEL = "4 MB";
