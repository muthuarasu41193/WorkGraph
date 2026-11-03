import { NextResponse } from "next/server";

import { verifyDigestUnsubscribeToken } from "@/lib/alerts/digest-token";
import { WG_COLORS } from "@/lib/design-tokens";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function confirmationHtml(message: string, ok: boolean): string {
  const title = ok ? "Alerts updated" : "Could not unsubscribe";
  const pageBg = WG_COLORS.background;
  const cardBg = WG_COLORS.surfaceRaised;
  const ink = WG_COLORS.textPrimary;
  const muted = WG_COLORS.textSecondary;
  const brand = WG_COLORS.primary;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · WorkGraph</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: ${pageBg}; color: ${ink}; }
    main { max-width: 32rem; margin: 3rem auto; padding: 1.5rem; background: ${cardBg}; border-radius: 8px; }
    h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
    p { margin: 0; line-height: 1.5; color: ${muted}; }
    a { color: ${ink}; }
    .brand { color: ${brand}; font-weight: 700; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <main>
    <p class="brand">WorkGraph</p>
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top:1.25rem"><a href="/alerts">Manage alerts</a></p>
  </main>
</body>
</html>`;
}

async function applyUnsubscribe(token: string | null): Promise<{ ok: boolean; message: string; status: number }> {
  if (!token) {
    return { ok: false, message: "Missing unsubscribe token.", status: 400 };
  }

  const payload = verifyDigestUnsubscribeToken(token);
  if (!payload) {
    return {
      ok: false,
      message: "This unsubscribe link is invalid or has expired. Sign in and manage alerts from Settings.",
      status: 400,
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, message: "Service unavailable. Please try again later.", status: 503 };
  }

  let query = admin
    .from("job_alerts")
    .update({ frequency: "off" })
    .eq("user_id", payload.userId);

  if (payload.alertId !== "all") {
    query = query.eq("id", payload.alertId);
  }

  const { data, error } = await query.select("id");
  if (error) {
    return { ok: false, message: "Could not update your alerts. Please try again.", status: 500 };
  }

  const count = data?.length ?? 0;
  if (count === 0) {
    return {
      ok: true,
      message: "No active alerts needed updating. You will not receive further digests for this link.",
      status: 200,
    };
  }

  return {
    ok: true,
    message:
      payload.alertId === "all"
        ? "All of your job alert emails are turned off."
        : "That job alert is turned off. You can turn it back on anytime from Alerts.",
    status: 200,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const result = await applyUnsubscribe(token);
  return new NextResponse(confirmationHtml(result.message, result.ok), {
    status: result.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("token");
  if (!token) {
    try {
      const form = await request.formData();
      const fromForm = form.get("token");
      if (typeof fromForm === "string") token = fromForm;
    } catch {
      // empty body is fine for List-Unsubscribe=One-Click
    }
  }
  const result = await applyUnsubscribe(token);
  if (!result.ok) {
    return new NextResponse(null, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }
  return new NextResponse(null, { status: 202, headers: { "Cache-Control": "no-store" } });
}
