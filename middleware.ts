import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PROVIDER = (
  process.env.NEXT_PUBLIC_AUTH_PROVIDER ??
  process.env.AUTH_PROVIDER ??
  "supabase"
).toLowerCase();

function supabaseEnvReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Refreshes auth cookies (Supabase by default; SuperTokens only without Supabase keys).
 */
export async function middleware(request: NextRequest) {
  if (!supabaseEnvReady() && AUTH_PROVIDER === "supertokens") {
    const uri = process.env.SUPERTOKENS_CONNECTION_URI?.trim();
    if (!uri) return NextResponse.next({ request });

    try {
      const { initSuperTokensBackend } = await import("./lib/supertokens/backend");
      initSuperTokensBackend();
      const { withSession } = await import("supertokens-node/nextjs");
      return withSession(
        request,
        async () => NextResponse.next({ request }),
        { sessionRequired: false },
      );
    } catch {
      return NextResponse.next({ request });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
