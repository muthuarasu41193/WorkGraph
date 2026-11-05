import { NextResponse } from "next/server";

/** Permanent redirect — marketing page now lives at `/`. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url), 308);
}
