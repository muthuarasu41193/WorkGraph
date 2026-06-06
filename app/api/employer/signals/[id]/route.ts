import { NextResponse } from "next/server";
import {
  EmployerApiError,
  getEmployerSignal,
  updateEmployerSignal,
  type HiringSignalInput,
} from "@/lib/employer/employer-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const signal = await getEmployerSignal(id, request);
    if (!signal) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, signal });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load signal";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as HiringSignalInput;
    const signal = await updateEmployerSignal(id, body, request);
    return NextResponse.json({ ok: true, signal });
  } catch (err) {
    if (err instanceof EmployerApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to update signal";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
