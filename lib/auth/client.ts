"use client";

import { getAuthProvider, supertokensEnabled } from "./config";

export async function signInWithPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (supertokensEnabled()) {
    const { initSuperTokensFrontend } = await import("../supertokens/frontend");
    initSuperTokensFrontend();
    const { signIn } = await import("supertokens-auth-react/recipe/emailpassword");
    const result = await signIn({
      formFields: [
        { id: "email", value: email.trim() },
        { id: "password", value: password },
      ],
    });
    if (result.status === "OK") {
      await fetch("/api/auth/wg-sync", { method: "POST", credentials: "include" });
      return { ok: true };
    }
    if (result.status === "FIELD_ERROR") {
      return { ok: false, error: result.formFields.map((f) => f.error).join(" ") };
    }
    return { ok: false, error: "Sign in failed" };
  }

  const { createBrowserSupabaseClient } = await import("../supabase");
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: error.message };
  const { syncServerAuthCookies, waitForSignedIn } = await import("../client-auth");
  const ready = await waitForSignedIn();
  if (!ready) return { ok: false, error: "Session did not sync" };
  await syncServerAuthCookies();
  return { ok: true };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (supertokensEnabled()) {
    const { initSuperTokensFrontend } = await import("../supertokens/frontend");
    initSuperTokensFrontend();
    const { signUp } = await import("supertokens-auth-react/recipe/emailpassword");
    const result = await signUp({
      formFields: [
        { id: "email", value: email.trim() },
        { id: "password", value: password },
      ],
    });
    if (result.status === "OK") {
      await fetch("/api/auth/wg-sync", { method: "POST", credentials: "include" });
      return { ok: true };
    }
    if (result.status === "FIELD_ERROR") {
      return { ok: false, error: result.formFields.map((f) => f.error).join(" ") };
    }
    return { ok: false, error: "Sign up failed" };
  }

  const { createBrowserSupabaseClient } = await import("../supabase");
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  if (supertokensEnabled()) {
    return { ok: false, error: "Password reset is managed through SuperTokens." };
  }
  const { createBrowserSupabaseClient } = await import("../supabase");
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  const { syncServerAuthCookies } = await import("../client-auth");
  await syncServerAuthCookies();
  return { ok: true };
}

export async function signOutClient(): Promise<void> {
  if (supertokensEnabled()) {
    const { initSuperTokensFrontend } = await import("../supertokens/frontend");
    initSuperTokensFrontend();
    const Session = await import("supertokens-auth-react/recipe/session");
    await Session.signOut();
    return;
  }
  const { createBrowserSupabaseClient } = await import("../supabase");
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.signOut();
}

export function authProviderLabel(): string {
  return getAuthProvider() === "supertokens" ? "SuperTokens" : "Supabase";
}
