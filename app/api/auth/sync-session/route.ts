import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SyncBody = {
  access_token?: string;
  refresh_token?: string;
};

/**
 * Writes the browser Supabase session into HTTP-only cookies so middleware,
 * Server Components, and Route Handlers see the same user as the client.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 500 }
    );
  }

  let body: SyncBody = {};
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const access_token = typeof body.access_token === "string" ? body.access_token.trim() : "";
  const refresh_token = typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "access_token and refresh_token are required." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
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
  });

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "Could not sync session." }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message ?? "Session invalid." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
