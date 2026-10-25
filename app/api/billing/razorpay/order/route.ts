import { productionOrderDeps } from "@/lib/billing/server";
import { handleCreateOrder } from "@/lib/billing/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleCreateOrder(request, productionOrderDeps());
}
