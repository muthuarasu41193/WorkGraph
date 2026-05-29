/** True when legacy Supabase auth + profiles are configured. */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function supabaseServiceRoleConfigured(): boolean {
  return supabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
