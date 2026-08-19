import { ValidationError } from "@/lib/validation/errors";
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "@/lib/upload-limits";
import { isPdfResume } from "@/lib/validation/resume";

export type ResumeFileKind = "pdf" | "docx";

function looksLikePdf(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 16).toString("latin1");
  return head.includes("%PDF");
}

function looksLikeZip(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

/**
 * Validate size and magic bytes. Filename/MIME are not trusted as the only check.
 */
export function assertResumeFileBytes(
  buffer: Buffer,
  fileName: string,
  mimeType?: string | null,
): ResumeFileKind {
  if (!buffer.length) {
    throw new ValidationError("The uploaded file is empty.");
  }
  if (buffer.length > MAX_RESUME_UPLOAD_BYTES) {
    throw new ValidationError(`File is too large. Maximum size is ${MAX_RESUME_UPLOAD_LABEL}.`);
  }

  if (isPdfResume(fileName, mimeType) || looksLikePdf(buffer)) {
    if (!looksLikePdf(buffer)) {
      throw new ValidationError("File content is not a valid PDF.");
    }
    return "pdf";
  }

  if (fileName.toLowerCase().endsWith(".docx") || mimeType?.includes("wordprocessingml")) {
    if (!looksLikeZip(buffer)) {
      throw new ValidationError("File content is not a valid DOCX.");
    }
    return "docx";
  }

  throw new ValidationError("Only PDF and DOCX files are supported.");
}
