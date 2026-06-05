import { NextResponse } from "next/server";
import { getPublicCompanyBySlug } from "@/lib/employer/public-company";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const company = await getPublicCompanyBySlug(slug);
  if (!company) {
    return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...company });
}
