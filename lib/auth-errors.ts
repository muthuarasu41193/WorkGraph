/** Map Supabase / network errors to actionable copy for auth and profile flows. */

export function describeAuthError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;

    if (/Missing required environment variable/i.test(msg)) {
      return "This site is missing Supabase configuration. Ask the admin to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then redeploy.";
    }

    if (/failed to fetch/i.test(msg) || error.name === "TypeError") {
      return "Could not reach Supabase (network blocked or project unavailable). Check your connection, disable ad blockers for supabase.co, and confirm the Supabase project is active.";
    }

    return humanizeSupabaseAuthMessage(msg);
  }

  return "Something went wrong. Please try again.";
}

export function humanizeSupabaseAuthMessage(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox (and spam), then sign in.";
  }
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "Invalid email or password, or your email is not confirmed yet.";
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "This email already has an account. Sign in instead.";
  }
  if (msg.includes("password")) {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (msg.includes("invalid") && msg.includes("email")) {
    return "Enter a valid email address (Supabase rejects some test domains like example.com).";
  }
  return raw;
}

export function describeFetchError(error: unknown): string {
  if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
    return "Could not reach the server (Failed to fetch). Check your connection and try again — if this persists, the deployment may be missing env vars or Supabase may be unreachable.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
