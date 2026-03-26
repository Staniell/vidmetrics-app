import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.12)",
          }}
        />

        {/* Bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 110,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 24,
              height: 44,
              borderRadius: 6,
              background: "#64748b",
            }}
          />
          <div
            style={{
              width: 24,
              height: 72,
              borderRadius: 6,
              background: "#94a3b8",
            }}
          />
          <div
            style={{
              width: 24,
              height: 100,
              borderRadius: 6,
              background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
