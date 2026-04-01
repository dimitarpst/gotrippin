import type { ReactNode } from "react";

/** Trip routes follow the root theme (light/dark from `ThemeProvider`). */
export default function TripsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
