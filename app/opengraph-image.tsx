import { ImageResponse } from "next/og";
import { WG_COLORS } from "@/lib/design-tokens";

export const runtime = "edge";
export const alt = "WorkGraph — Search the live job index";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: WG_COLORS.ink,
          color: WG_COLORS.accentInk,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: WG_COLORS.accent,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            W
          </div>
          <span style={{ fontSize: 36, fontWeight: 700 }}>WorkGraph</span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: 0, maxWidth: 900 }}>
          Search the live job index
        </h1>
        <p style={{ fontSize: 24, color: WG_COLORS.inkSubtle, marginTop: 24, maxWidth: 800, lineHeight: 1.4 }}>
          Match notes are estimates when a profile is available to compare.
        </p>
      </div>
    ),
    { ...size },
  );
}
