import { handlePrepPackShareResolve } from "@/lib/prep-pack/handle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

/** Public resolve for a prep pack share token. Returns derived fields only. */
export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  return handlePrepPackShareResolve(token);
}
