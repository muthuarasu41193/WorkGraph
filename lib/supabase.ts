import {
  createBrowserClient as createClientComponentClient,
  createServerClient as createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
function assertEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function createBrowserSupabaseClient(): SupabaseClient {
  return createClientComponentClient(
    assertEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    assertEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

type CookieStoreLike = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

export function createServerSupabaseClient(cookieStore: CookieStoreLike): SupabaseClient {
  return createServerComponentClient(
    assertEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    assertEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
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
            // no-op when setting cookies is unavailable
          }
        },
      },
    }
  );
}

