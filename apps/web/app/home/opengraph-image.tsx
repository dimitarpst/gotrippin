import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "gotrippin — group trip planner"

export const size = { width: 1200, height: 630 }

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #12121a 0%, #1c1c28 45%, #14141c 100%)",
          color: "#fafafa",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            background: "linear-gradient(90deg, #ff7670, #a78bfa)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          gotrippin
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            fontWeight: 600,
            opacity: 0.92,
            maxWidth: 920,
            textAlign: "center",
            lineHeight: 1.25,
            padding: "0 56px",
          }}
        >
          Group trip planner — shared itinerary, map and one link
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 22,
            opacity: 0.55,
            fontWeight: 500,
          }}
        >
          Web today · native apps planned
        </div>
      </div>
    ),
    { ...size },
  )
}
