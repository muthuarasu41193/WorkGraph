import { NextResponse } from "next/server";
import { getAuthProvider } from "../../../../lib/auth/config";
import { getSessionUser } from "../../../../lib/auth/session-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ authenticated: false, provider: getAuthProvider() }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    provider: user.provider,
    userId: user.id,
    email: user.email,
  });
}
