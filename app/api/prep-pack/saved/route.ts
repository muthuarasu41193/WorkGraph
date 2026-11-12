import { handlePrepPackList } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** List saved prep packs for the signed-in user. */
export async function GET() {
  return handlePrepPackList();
}
