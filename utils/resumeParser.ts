import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    const lowerName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      return parsed.text.trim();
    }

    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      return parsed.value.trim();
    }

    throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract text from file.";
    throw new Error(`Resume parsing failed: ${message}`);
  }
}

export async function extractResumeText(fileBuffer: Buffer, fileName: string): Promise<string> {
  const fallbackFile = new File([new Uint8Array(fileBuffer)], fileName);
  return extractTextFromFile(fallbackFile);
}
