import { handleTailoringRequest } from "@/lib/tailoring/handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Single Groq call — same budget as cover-letter generation. */
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleTailoringRequest(request);
}
