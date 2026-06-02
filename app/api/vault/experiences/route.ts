import { NextResponse } from "next/server";
import { VaultApiError, createDraftExperience, listPublishedExperiences } from "@/lib/vault-server";
import type { VaultListFilters } from "@/lib/vault";
import { isVaultDifficulty, isVaultResult } from "@/lib/vault";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: VaultListFilters = {};

    const q = searchParams.get("q");
    if (q) filters.q = q;

    const difficulty = searchParams.get("difficulty");
    if (difficulty && isVaultDifficulty(difficulty)) filters.difficulty = difficulty;

    const rounds = searchParams.get("rounds");
    if (rounds) filters.rounds = Number(rounds);

    const result = searchParams.get("result");
    if (result && isVaultResult(result)) filters.result = result;

    const date_from = searchParams.get("date_from");
    if (date_from) filters.date_from = date_from;

    const date_to = searchParams.get("date_to");
    if (date_to) filters.date_to = date_to;

    const experiences = await listPublishedExperiences(filters);
    return NextResponse.json({ ok: true, experiences });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to load experiences";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const experience = await createDraftExperience();
    return NextResponse.json({ ok: true, experience }, { status: 201 });
  } catch (err) {
    if (err instanceof VaultApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to create draft";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
