import { NextResponse } from "next/server";
import {
  ApplicationsApiError,
  createApplicationForUser,
  listApplicationsForUser,
} from "@/lib/applications-server";
import { applicationInsertSchema, isValidationError, parseJsonBody, publicErrorResponse } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const applications = await listApplicationsForUser();
    return NextResponse.json({ ok: true, applications });
  } catch (err) {
    if (err instanceof ApplicationsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not load applications. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not load applications. Please try again.",
      style: "ok",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, applicationInsertSchema);
    const application = await createApplicationForUser(body);
    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid application.", style: "ok" });
    }
    if (err instanceof ApplicationsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not create application. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not create application. Please try again.",
      style: "ok",
    });
  }
}
