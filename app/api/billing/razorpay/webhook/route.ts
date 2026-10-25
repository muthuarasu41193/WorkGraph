import { handleWebhook } from "@/lib/billing/handlers";
import { productionWebhookDeps } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleWebhook(request, productionWebhookDeps());
}
