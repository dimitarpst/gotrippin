"use client"

interface AuroraBackgroundProps {
  className?: string
}

/**
 * Gradients live in `.aurora-stack-fill` / `.dark .aurora-stack-fill` in `globals.css`
 * (not `var(--multi-layer)` + inline `backgroundImage` — broken in several WebKit builds).
 */
export default function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className || ""}`}>
      <div className="aurora-stack-fill absolute inset-0" />
    </div>
  )
}
