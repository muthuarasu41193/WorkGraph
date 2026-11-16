import { handlePrepPackShareCreate, handlePrepPackShareList } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Create a share link for a saved prep pack owned by the signed-in user. */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handlePrepPackShareCreate(id);
}

/** List share links for a saved prep pack owned by the signed-in user. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handlePrepPackShareList(id);
}
