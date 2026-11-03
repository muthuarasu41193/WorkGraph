import { NextResponse } from "next/server";

import { AlertsApiError, createAlertForUser, listAlertsForUser } from "@/lib/alerts/server";
import {
  alertCreateSchema,
  isValidationError,
  parseJsonBody,
  publicErrorResponse,
  withAlertCreateDefaults,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alerts = await listAlertsForUser();
    return NextResponse.json({ ok: true, alerts });
  } catch (err) {
    if (err instanceof AlertsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not load alerts. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not load alerts. Please try again.",
      style: "ok",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = withAlertCreateDefaults(await parseJsonBody(request, alertCreateSchema));
    const alert = await createAlertForUser(body);
    return NextResponse.json({ ok: true, alert }, { status: 201 });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid alert.", style: "ok" });
    }
    if (err instanceof AlertsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not create alert. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not create alert. Please try again.",
      style: "ok",
    });
  }
}
