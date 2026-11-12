import { NextResponse } from "next/server"
import { z } from "zod"

import { LISTING_REPORT_REASONS } from "@/lib/accountability"
import { getSessionUser } from "@/lib/auth/session-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const reasonIds = LISTING_REPORT_REASONS.map((item) => item.id) as [
  (typeof LISTING_REPORT_REASONS)[number]["id"],
  ...(typeof LISTING_REPORT_REASONS)[number]["id"][],
]

const bodySchema = z.object({
  jobId: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().max(300).optional(),
  jobCompany: z.string().trim().max(300).optional(),
  reason: z.enum(reasonIds),
  details: z.string().trim().max(2000).optional(),
})

const RATE_LIMIT = 10
const WINDOW_MS = 60 * 60 * 1000
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function clientKey(request: Request, userId: string | null) {
  if (userId) return `user:${userId}`
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  return `ip:${ip}`
}

function isRateLimited(key: string) {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count += 1
  rateLimitStore.set(key, entry)
  return false
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    const key = clientKey(request, user?.id ?? null)
    if (isRateLimited(key)) {
      return NextResponse.json(
        { ok: false, error: "Too many reports from this device. Try again in an hour." },
        { status: 429 },
      )
    }

    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Choose a reason and try again." }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Reporting is not configured on this server yet." },
        { status: 503 },
      )
    }

    const { error } = await admin.from("job_listing_reports").insert({
      job_public_id: parsed.data.jobId,
      job_title: parsed.data.jobTitle ?? null,
      job_company: parsed.data.jobCompany ?? null,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
      reporter_id: user?.id ?? null,
      reporter_email: user?.email ?? null,
      user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
    })

    if (error) {
      console.error("[job-report] insert failed", error.code)
      return NextResponse.json(
        { ok: false, error: "The report did not save. Try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { ok: false, error: "The report did not save. Try again." },
      { status: 500 },
    )
  }
}
