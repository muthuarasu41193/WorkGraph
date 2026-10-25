import { handleCoverLetterGenerate, loadCoverLetterResumeText } from "@/lib/cover-letters/handle-generate";
import { requireCoverLetterSession } from "@/lib/cover-letters/session";
import { generateCoverLetter } from "@/lib/cover-letters/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleCoverLetterGenerate(request, {
    requireSession: requireCoverLetterSession,
    loadResumeText: loadCoverLetterResumeText,
    generate: generateCoverLetter,
  });
}
