import type { AuthProvider } from "../../packages/shared/types/phase3";
import { supabaseConfigured } from "../supabase-enabled";

/** Active auth backend — defaults to Supabase. */
export function getAuthProvider(): AuthProvider {
  if (supabaseConfigured()) return "supabase";
  const raw = (
    process.env.NEXT_PUBLIC_AUTH_PROVIDER ??
    process.env.AUTH_PROVIDER ??
    "supabase"
  ).toLowerCase();
  return raw === "supertokens" ? "supertokens" : "supabase";
}

/** SuperTokens only when explicitly configured and Supabase is not. */
export function supertokensEnabled(): boolean {
  if (supabaseConfigured()) return false;
  if (getAuthProvider() !== "supertokens") return false;
  return Boolean(process.env.SUPERTOKENS_CONNECTION_URI?.trim());
}

export function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
