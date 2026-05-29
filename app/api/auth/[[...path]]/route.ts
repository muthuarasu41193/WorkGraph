import { getAppDirRequestHandler } from "supertokens-node/nextjs";
import { supertokensEnabled } from "../../../../lib/auth/config";
import { initSuperTokensBackend } from "../../../../lib/supertokens/backend";

export const dynamic = "force-dynamic";

type AuthHandler = ReturnType<typeof getAppDirRequestHandler>;

let handler: AuthHandler | null | undefined;

function resolveHandler(): AuthHandler | null {
  if (handler !== undefined) return handler;
  if (!supertokensEnabled()) {
    handler = null;
    return handler;
  }
  initSuperTokensBackend();
  handler = getAppDirRequestHandler();
  return handler;
}

function notConfiguredResponse(): Response {
  return Response.json(
    { error: "SuperTokens auth is not configured on this deployment." },
    { status: 503 },
  );
}

async function handle(request: Request): Promise<Response> {
  const authHandler = resolveHandler();
  if (!authHandler) return notConfiguredResponse();
  return authHandler(request);
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}

export function DELETE(request: Request) {
  return handle(request);
}

export function PUT(request: Request) {
  return handle(request);
}

export function PATCH(request: Request) {
  return handle(request);
}

export function HEAD(request: Request) {
  return handle(request);
}

export function OPTIONS(request: Request) {
  return handle(request);
}
