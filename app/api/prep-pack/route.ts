import { handlePrepPackBuild } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Build a free interview prep pack. Auth optional. Does not persist anonymous results. */
export async function POST(request: Request) {
  return handlePrepPackBuild(request);
}
