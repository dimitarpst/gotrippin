"use client";

export default function AuroraBackground() {
  const layers = [
    {
      s: {
        background: `radial-gradient(120% 90% at 50% 110%, black 0%, hsl(0 0% 4%) 50%, black 100%)`,
      },
    },
    {
      c: "opacity-[0.28] mix-blend-screen",
      s: {
        background: `linear-gradient(135deg,
          color-mix(in oklab, var(--color-accent) 60%, black 40%) 0%,
          color-mix(in oklab, var(--color-accent) 30%, black 70%) 60%,
          transparent 100%)`,
      },
    },
    {
      c: "opacity-[0.15] mix-blend-overlay",
      s: {
        background: `linear-gradient(315deg,
          color-mix(in oklab, black 80%, var(--color-accent) 20%) 0%,
          transparent 70%)`,
      },
    },
    {
      c: "opacity-[0.05]",
      s: {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 6px)",
      },
    },
    {
      s: {
        background: `radial-gradient(circle at center,
          transparent 55%,
          color-mix(in oklab, var(--color-accent) 25%, black 75%) 100%)`,
      },
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {layers.map((l, i) => (
        <div key={i} className={`absolute inset-0 ${l.c || ""}`} style={l.s} />
      ))}
    </div>
  );
}
