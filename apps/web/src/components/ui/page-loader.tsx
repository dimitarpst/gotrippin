"use client"

import AuroraBackground from "@/components/effects/aurora-background"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  message?: string
  className?: string
  showAurora?: boolean
}

/**
 * PageLoader - A full-page loading state component.
 * Uses shadcn Spinner and optional AuroraBackground for consistency.
 */
export default function PageLoader({
  message,
  className,
  showAurora = true,
}: PageLoaderProps) {
  return (
    <main
      className={cn(
        "relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden",
        className
      )}
    >
      {showAurora && <AuroraBackground />}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center">
          <Spinner className="size-8 text-[var(--color-accent)] mx-auto mb-4" />
          {message && (
            <p className="text-white/80 text-lg animate-pulse">{message}</p>
          )}
        </div>
      </div>
    </main>
  )
}
