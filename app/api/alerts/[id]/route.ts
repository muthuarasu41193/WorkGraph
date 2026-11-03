import { NextResponse } from "next/server";

import {
  AlertsApiError,
  deleteAlertForUser,
  updateAlertForUser,
} from "@/lib/alerts/server";
import {
  alertIdSchema,
  alertUpdateSchema,
  isValidationError,
  parseJsonBody,
  parseWithSchema,
  publicErrorResponse,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(alertIdSchema, id);
    const body = await parseJsonBody(request, alertUpdateSchema);
    const alert = await updateAlertForUser(id, body);
    return NextResponse.json({ ok: true, alert });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid alert update.", style: "ok" });
    }
    if (err instanceof AlertsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not update alert. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not update alert. Please try again.",
      style: "ok",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(alertIdSchema, id);
    await deleteAlertForUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid alert id.", style: "ok" });
    }
    if (err instanceof AlertsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not delete alert. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not delete alert. Please try again.",
      style: "ok",
    });
  }
}
