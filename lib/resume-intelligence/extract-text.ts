import mammoth from "mammoth";

import { ValidationError } from "@/lib/validation/errors";
import { LIMITS } from "@/lib/validation/primitives";

import { assertResumeFileBytes, type ResumeFileKind } from "./file";
import { normalizeResumeText } from "./text";

const MIN_EXTRACTED_CHARS = 24;

export type ExtractedResumeText = {
  text: string;
  kind: ResumeFileKind;
};

export async function extractResumeTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string | null,
): Promise<ExtractedResumeText> {
  const kind = assertResumeFileBytes(buffer, fileName, mimeType);
  let raw = "";

  try {
    if (kind === "pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      raw = parsed.text ?? "";
    } else {
      const parsed = await mammoth.extractRawText({ buffer });
      raw = parsed.value ?? "";
    }
  } catch {
    throw new ValidationError(
      "We could not read this file. Try another PDF/DOCX export, or enter your profile manually.",
    );
  }

  const text = normalizeResumeText(raw);
  if (text.replace(/\s+/g, " ").trim().length < MIN_EXTRACTED_CHARS) {
    throw new ValidationError(
      "We could not extract enough text from this file. Try another PDF/DOCX export, or enter your profile manually.",
    );
  }
  if (text.length > LIMITS.resumeText) {
    return { text: text.slice(0, LIMITS.resumeText), kind };
  }
  return { text, kind };
}
