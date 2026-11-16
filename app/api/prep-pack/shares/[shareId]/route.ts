import { handlePrepPackShareRevoke } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ shareId: string }> };

/** Revoke a share link owned by the signed-in user. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { shareId } = await context.params;
  return handlePrepPackShareRevoke(shareId);
}
