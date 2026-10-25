import { handleVerifyPayment } from "@/lib/billing/handlers";
import { productionVerifyDeps } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleVerifyPayment(request, productionVerifyDeps());
}
