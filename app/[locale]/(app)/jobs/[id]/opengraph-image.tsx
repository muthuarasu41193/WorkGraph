import { ImageResponse } from "next/og"
import { cookies } from "next/headers"
import { WG_COLORS } from "@/lib/design-tokens"
import { fetchLiveJobByPublicId } from "@/lib/jobs-catalog"
import { createServerSupabaseClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const alt = "Job from the WorkGraph index"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function JobOpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let title = "Job"
  let company = "WorkGraph"
  try {
    const row = await fetchLiveJobByPublicId(createServerSupabaseClient(await cookies()), decodeURIComponent(id))
    if (row?.title) title = row.title
    if (row?.company) company = row.company
  } catch {
    title = "Job"
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          background: WG_COLORS.ink,
          color: WG_COLORS.accentInk,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 16 }}>{company}</div>
        <div style={{ fontSize: 64, lineHeight: 1.1 }}>{title.slice(0, 120)}</div>
      </div>
    ),
    size,
  )
}
