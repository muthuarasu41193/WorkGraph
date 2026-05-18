import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextRaw = requestUrl.searchParams.get("next") || "/profile";
  const next = nextRaw.startsWith("/") ? nextRaw : "/profile";
  const origin = requestUrl.origin;
  const loginWith = (errorKey: string) =>
    NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(errorKey)}`);

  if (!code) {
    return loginWith("missing_code");
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);
      return loginWith(error.message || "exchange_failed");
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "callback_failed";
    console.error("[auth/callback]", message);
    return loginWith(message);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
