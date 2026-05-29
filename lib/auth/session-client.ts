"use client";

import { supabaseConfigured } from "../supabase-enabled";
import { supertokensEnabled } from "./config";
import { syncClientSession } from "../client-auth";

export type ClientSession = {
  userId: string;
  email: string | null;
};

/** Ensure the user is signed in; returns session info. */
export async function ensureClientSession(): Promise<ClientSession | null> {
  if (supabaseConfigured()) {
    const ok = await syncClientSession();
    if (!ok) return null;
    const { createBrowserSupabaseClient } = await import("../supabase");
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { userId: user.id, email: user.email ?? null };
  }

  if (supertokensEnabled()) {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { userId?: string; email?: string | null };
    if (!data.userId) return null;
    return { userId: data.userId, email: data.email ?? null };
  }

  const ok = await syncClientSession();
  if (!ok) return null;

  const { createBrowserSupabaseClient } = await import("../supabase");
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id, email: user.email ?? null };
}
