import { NextResponse } from "next/server";
import {
  EmployerApiError,
  createEmployerSignal,
  listEmployerSignals,
  type HiringSignalInput,
} from "@/lib/employer/employer-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signals = await listEmployerSignals();
    return NextResponse.json({ ok: true, signals });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load signals";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HiringSignalInput;
    const signal = await createEmployerSignal(body);
    return NextResponse.json({ ok: true, signal }, { status: 201 });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to create signal";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
