import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

/**
 * Resolve the signed-in user from Authorization bearer JWT and/or Supabase SSR cookies.
 */
export async function getSupabaseSessionUser(request?: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return {
      data: { user: null },
      error: new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    } as const;
  }

  const bearer = request ? getBearerToken(request) : null;
  if (bearer && serviceRole) {
    const admin = createClient(url, serviceRole);
    const jwtResult = await admin.auth.getUser(bearer);
    if (jwtResult.data.user && !jwtResult.error) {
      return jwtResult;
    }
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes can fail in some Route Handler contexts.
        }
      },
    },
  });

  return supabase.auth.getUser();
}
