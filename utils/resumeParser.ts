import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ResumeFileType = "pdf" | "docx";

function detectResumeType(fileName: string): ResumeFileType {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".pdf")) return "pdf";
  if (normalized.endsWith(".docx")) return "docx";

  throw new Error("Unsupported resume file type. Upload PDF or DOCX.");
}

export async function extractResumeText(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const fileType = detectResumeType(fileName);

  if (fileType === "pdf") {
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text.trim();
  }

  const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
  return parsed.value.trim();
}
