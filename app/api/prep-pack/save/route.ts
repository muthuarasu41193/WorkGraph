import { handlePrepPackSave } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Save a derived prep pack for the signed-in user. Rejects raw job descriptions. */
export async function POST(request: Request) {
  return handlePrepPackSave(request);
}
