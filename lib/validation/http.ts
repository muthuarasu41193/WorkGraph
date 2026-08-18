import { NextResponse } from "next/server";

import {
  ValidationError,
  isValidationError,
  looksLikeInternalError,
  publicInternalMessage,
} from "./errors";

type ErrorBodyStyle = "error" | "ok";

function errorPayload(message: string, style: ErrorBodyStyle, details?: ValidationError["details"]) {
  if (style === "ok") {
    return details?.length ? { ok: false as const, error: message, details } : { ok: false as const, error: message };
  }
  return details?.length ? { error: message, details } : { error: message };
}

export function validationResponse(error: ValidationError, style: ErrorBodyStyle = "error") {
  return NextResponse.json(errorPayload(error.message, style, error.details), { status: 400 });
}

export function publicErrorResponse(
  error: unknown,
  opts: {
    fallback: string;
    style?: ErrorBodyStyle;
    status?: number;
  },
) {
  const style = opts.style ?? "error";
  if (isValidationError(error)) {
    return validationResponse(error, style);
  }
  const status = opts.status ?? 500;
  const raw = error instanceof Error ? error.message : "";
  if (status >= 500) {
    const safe =
      status !== 500 && raw && !looksLikeInternalError(raw)
        ? raw
        : publicInternalMessage(error, opts.fallback);
    return NextResponse.json(errorPayload(safe, style), { status });
  }
  const message = !raw || looksLikeInternalError(raw) ? opts.fallback : raw;
  return NextResponse.json(errorPayload(message, style), { status });
}

export { isValidationError, ValidationError };
