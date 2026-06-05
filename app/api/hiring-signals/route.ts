import { NextResponse } from "next/server";
import { EmployerApiError } from "@/lib/employer/employer-server";
import { listLiveHiringSignals } from "@/lib/employer/hiring-signals-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signals = await listLiveHiringSignals(80);
    return NextResponse.json({ ok: true, signals });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load hiring signals";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
