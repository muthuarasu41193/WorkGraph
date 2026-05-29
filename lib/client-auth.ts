import { createBrowserSupabaseClient } from "./supabase";

/** Mirror the browser JWT session into SSR auth cookies (middleware + RSC). */
export async function syncServerAuthCookies(): Promise<boolean> {
  try {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token || !session.refresh_token) return false;

    const res = await fetch("/api/auth/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/** Ensure the browser session is valid and auth cookies are written for SSR routes. */
export async function syncClientSession(): Promise<boolean> {
  const supabase = createBrowserSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user && !error) {
      await syncServerAuthCookies();
      return true;
    }
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session?.access_token) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  await syncServerAuthCookies();
  return true;
}

/** Wait briefly for Supabase to finish writing auth cookies after sign-in. */
export async function waitForSignedIn(timeoutMs = 4000): Promise<boolean> {
  if (await syncClientSession()) return true;

  const supabase = createBrowserSupabaseClient();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(ok);
    };

    const timer = setTimeout(() => {
      void syncClientSession().then((ok) => finish(ok));
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void syncClientSession().then((ok) => finish(ok));
      }
    });
  });
}

/** Full navigation so middleware + Server Components receive auth cookies. */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

export function loginRedirectPath(next = "/create-profile", reason = "session"): string {
  return `/login?next=${encodeURIComponent(next)}&reason=${encodeURIComponent(reason)}`;
}
