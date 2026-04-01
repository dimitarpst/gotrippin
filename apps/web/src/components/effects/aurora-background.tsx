"use client"

import type { CSSProperties } from "react"

interface AuroraBackgroundProps {
  className?: string
}

/**
 * Themed page backdrop: light = soft coral/paper wash; dark = original deep aurora.
 * Layers are driven by `--aurora-0` … `--aurora-4` in `app/globals.css`.
 */
export default function AuroraBackground({ className }: AuroraBackgroundProps) {
  const layers: { className?: string; style: CSSProperties }[] = [
    { style: { background: "var(--aurora-0)" } },
    {
      className:
        "opacity-[0.45] mix-blend-normal dark:opacity-[0.28] dark:mix-blend-screen",
      style: { background: "var(--aurora-1)" },
    },
    {
      className:
        "opacity-[0.25] mix-blend-normal dark:opacity-[0.15] dark:mix-blend-overlay",
      style: { background: "var(--aurora-2)" },
    },
    {
      className: "opacity-[0.08] dark:opacity-[0.05]",
      style: { background: "var(--aurora-3)" },
    },
    {
      className: "opacity-90 dark:opacity-100",
      style: { background: "var(--aurora-4)" },
    },
  ]

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className || ""}`}>
      {layers.map((l, i) => (
        <div key={i} className={`absolute inset-0 ${l.className || ""}`} style={l.style} />
      ))}
    </div>
  )
}
