import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
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
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.15)",
          }}
        />

        {/* Bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            height: 20,
            paddingBottom: 1,
          }}
        >
          <div
            style={{
              width: 4,
              height: 8,
              borderRadius: 1,
              background: "#64748b",
            }}
          />
          <div
            style={{
              width: 4,
              height: 13,
              borderRadius: 1,
              background: "#94a3b8",
            }}
          />
          <div
            style={{
              width: 4,
              height: 18,
              borderRadius: 1,
              background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
