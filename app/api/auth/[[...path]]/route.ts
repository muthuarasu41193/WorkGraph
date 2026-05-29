import { getAppDirRequestHandler } from "supertokens-node/nextjs";
import { initSuperTokensBackend } from "../../../../lib/supertokens/backend";

initSuperTokensBackend();

const handler = getAppDirRequestHandler();

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handler(request);
}

export function POST(request: Request) {
  return handler(request);
}

export function DELETE(request: Request) {
  return handler(request);
}

export function PUT(request: Request) {
  return handler(request);
}

export function PATCH(request: Request) {
  return handler(request);
}

export function HEAD(request: Request) {
  return handler(request);
}

export function OPTIONS(request: Request) {
  return handler(request);
}
