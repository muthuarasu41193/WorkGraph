import { NextResponse } from "next/server";
import {
  ApplicationsApiError,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/applications-server";
import {
  applicationIdSchema,
  applicationUpdateSchema,
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
    parseWithSchema(applicationIdSchema, id);
    const body = await parseJsonBody(request, applicationUpdateSchema);
    const application = await updateApplicationForUser(id, body);
    return NextResponse.json({ ok: true, application });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid application update.", style: "ok" });
    }
    if (err instanceof ApplicationsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not update application. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not update application. Please try again.",
      style: "ok",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    parseWithSchema(applicationIdSchema, id);
    await deleteApplicationForUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isValidationError(err)) {
      return publicErrorResponse(err, { fallback: "Invalid application id.", style: "ok" });
    }
    if (err instanceof ApplicationsApiError) {
      return publicErrorResponse(err, {
        fallback: "Could not delete application. Please try again.",
        style: "ok",
        status: err.status,
      });
    }
    return publicErrorResponse(err, {
      fallback: "Could not delete application. Please try again.",
      style: "ok",
    });
  }
}
