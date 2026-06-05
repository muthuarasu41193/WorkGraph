import { NextResponse } from "next/server";
import {
  EmployerApiError,
  getEmployerProfileForUser,
  upsertEmployerProfile,
} from "@/lib/employer/employer-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getEmployerProfileForUser();
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load employer profile";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | undefined>;
    const profile = await upsertEmployerProfile({
      company_name: body.company_name ?? "",
      company_slug: body.company_slug,
      tagline: body.tagline,
      website_url: body.website_url,
      hiring_philosophy: body.hiring_philosophy,
      team_size: body.team_size,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to save employer profile";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
