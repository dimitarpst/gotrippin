"use client"

import AuroraBackground from "@/components/effects/aurora-background"
import FloatingHeader from "@/components/layout/FloatingHeader"
import DockBar from "@/components/layout/DockBar"

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <FloatingHeader />
      <div className="flex-1 flex items-center justify-center">
        <h1 className="z-10 text-6xl font-bold tracking-tight">Go Trippin’</h1>
      </div>
      <DockBar />
    </main>
  )
}
