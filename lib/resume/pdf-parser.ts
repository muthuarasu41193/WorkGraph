import pdfParse from "pdf-parse";

export async function extractResumeTextFromPdf(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return normalizeResumeText(parsed.text ?? "");
}

export function normalizeResumeText(text: string): string {
  return text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

