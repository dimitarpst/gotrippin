"use client";

interface HexProps {
  color: string;
  className?: string;
}

export function Hex({ color, className }: HexProps) {
  const display = color ? color.toUpperCase() : "#000000";
  return (
    <p
      className={`text-sm font-mono text-foreground ${className ?? ""}`}
      aria-live="polite"
    >
      {display}
    </p>
  );
}
