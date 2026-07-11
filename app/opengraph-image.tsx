import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WorkGraph — Find Jobs That Never Hit LinkedIn";
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
          background: "linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 50%, #0A0A0A 100%)",
          color: "white",
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
              background: "#C41E3A",
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
          Find Jobs That Never Hit LinkedIn
        </h1>
        <p style={{ fontSize: 24, color: "#a3a3a3", marginTop: 24, maxWidth: 800, lineHeight: 1.4 }}>
          AI-powered job intelligence from Reddit, Discord & 50+ hidden sources
        </p>
      </div>
    ),
    { ...size },
  );
}
