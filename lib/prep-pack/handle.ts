import { NextResponse } from "next/server";

import { checkRateLimit, clientIp } from "@/lib/hidden-opportunities/rate-limit";
import { logRouteError } from "@/lib/security/log";
import {
  isValidationError,
  parseJsonBody,
  parseWithSchema,
  publicErrorResponse,
  readJsonBody,
} from "@/lib/validation";
import {
  prepPackBuildSchema,
  prepPackIdSchema,
  prepPackSaveSchema,
} from "@/lib/validation/prep-pack";

import {
  PrepPackApiError,
  buildPrepPackForRequest,
  deleteSavedPrepPackForUser,
  getSavedPrepPackForUser,
  listSavedPrepPacksForUser,
  savePrepPackForUser,
} from "./server";
import type { PrepPackResult, SavedPrepPack, SavedPrepPackSummary } from "./types";

export const PREP_PACK_RATE_LIMIT = 30;
export const PREP_PACK_RATE_WINDOW_MS = 60_000;

export type PrepPackBuildDeps = {
  rateLimit?: typeof checkRateLimit;
  ip?: typeof clientIp;
  build?: typeof buildPrepPackForRequest;
};

export type PrepPackSaveDeps = {
  save?: typeof savePrepPackForUser;
};

export type PrepPackListDeps = {
  list?: typeof listSavedPrepPacksForUser;
};

export type PrepPackGetDeps = {
  get?: typeof getSavedPrepPackForUser;
};

export type PrepPackDeleteDeps = {
  remove?: typeof deleteSavedPrepPackForUser;
};

function mapApiError(err: unknown, fallback: string) {
  if (err instanceof PrepPackApiError) {
    return publicErrorResponse(err, {
      fallback: err.message || fallback,
      style: "ok",
      status: err.status,
    });
  }
  if (isValidationError(err)) {
    return publicErrorResponse(err, { fallback, style: "ok" });
  }
  logRouteError("prep-pack", err);
  return publicErrorResponse(new Error(fallback), {
    fallback,
    style: "ok",
    status: 500,
  });
}

export async function handlePrepPackBuild(
  request: Request,
  deps: PrepPackBuildDeps = {},
): Promise<NextResponse> {
  const rateLimit = deps.rateLimit ?? checkRateLimit;
  const ip = deps.ip ?? clientIp;
  const build = deps.build ?? buildPrepPackForRequest;

  const rate = rateLimit(`prep-pack:${ip(request)}`, {
    limit: PREP_PACK_RATE_LIMIT,
    windowMs: PREP_PACK_RATE_WINDOW_MS,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  try {
    const body = await parseJsonBody(request, prepPackBuildSchema);
    const pack: PrepPackResult = await build(body);
    return NextResponse.json({
      ok: true,
      status: pack.status,
      pack,
    });
  } catch (err) {
    return mapApiError(err, "Could not build a prep pack.");
  }
}

export async function handlePrepPackSave(
  request: Request,
  deps: PrepPackSaveDeps = {},
): Promise<NextResponse> {
  const save = deps.save ?? savePrepPackForUser;
  try {
    const raw = await readJsonBody(request);
    if (raw && typeof raw === "object" && raw !== null && "jobDescription" in raw) {
      return NextResponse.json(
        { ok: false, error: "Job descriptions are not stored with saved packs." },
        { status: 400 },
      );
    }
    const body = parseWithSchema(prepPackSaveSchema, raw);
    const saved: SavedPrepPack = await save({
      roleId: body.roleId ?? null,
      roleLabel: body.roleLabel ?? null,
      skills: body.skills,
      guides: body.guides,
      checklist: body.checklist,
      estimateNotice: body.estimateNotice,
    });
    return NextResponse.json({ ok: true, pack: saved }, { status: 201 });
  } catch (err) {
    return mapApiError(err, "Could not save prep pack.");
  }
}

export async function handlePrepPackList(deps: PrepPackListDeps = {}): Promise<NextResponse> {
  const list = deps.list ?? listSavedPrepPacksForUser;
  try {
    const packs: SavedPrepPackSummary[] = await list();
    return NextResponse.json({ ok: true, packs });
  } catch (err) {
    return mapApiError(err, "Could not load saved prep packs.");
  }
}

export async function handlePrepPackGet(
  idRaw: string,
  deps: PrepPackGetDeps = {},
): Promise<NextResponse> {
  const get = deps.get ?? getSavedPrepPackForUser;
  try {
    const id = parseWithSchema(prepPackIdSchema, idRaw);
    const pack = await get(id);
    if (!pack) {
      return NextResponse.json({ ok: false, error: "Prep pack not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, pack });
  } catch (err) {
    return mapApiError(err, "Could not load that prep pack.");
  }
}

export async function handlePrepPackDelete(
  idRaw: string,
  deps: PrepPackDeleteDeps = {},
): Promise<NextResponse> {
  const remove = deps.remove ?? deleteSavedPrepPackForUser;
  try {
    const id = parseWithSchema(prepPackIdSchema, idRaw);
    await remove(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mapApiError(err, "Could not delete that prep pack.");
  }
}
