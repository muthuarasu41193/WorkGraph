import { handlePrepPackDelete, handlePrepPackGet } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Load one saved prep pack owned by the signed-in user. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handlePrepPackGet(id);
}

/** Delete a saved prep pack owned by the signed-in user. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handlePrepPackDelete(id);
}
