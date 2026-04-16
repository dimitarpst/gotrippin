"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Matches `TripGrid` card: hero image + gradient + badge + bottom title row + optional facepile. */
export function TripSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-white/[0.08] bg-[var(--surface)] shadow-lg backdrop-blur-xl">
      <div className="relative h-48 overflow-hidden">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute right-3 top-3">
          <Skeleton className="h-6 w-16 rounded-full bg-white/15" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex min-w-0 items-end justify-between gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-2 pr-1">
            <Skeleton className="h-6 max-w-[min(100%,14rem)] rounded-md bg-white/20" />
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Skeleton className="h-3 w-36 rounded bg-white/15" />
              <Skeleton className="h-3 w-14 rounded bg-white/15" />
            </div>
          </div>
          <div className="flex shrink-0 -space-x-2 pl-1">
            <Skeleton className="relative z-[2] h-9 w-9 rounded-full border-2 border-black/40 bg-white/15 ring-1 ring-white/20" />
            <Skeleton className="relative z-[1] h-9 w-9 rounded-full border-2 border-black/40 bg-white/15 ring-1 ring-white/20" />
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Mirrors `TripFilters` segmented control (All / Upcoming / Past). */
export function TripFiltersSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl px-4 pb-2 pt-3 sm:px-6 sm:pt-2 lg:px-8",
        className,
      )}
    >
      <div className="mb-4 inline-flex w-full max-w-full rounded-full bg-muted/40 p-1 dark:bg-white/[0.06] sm:w-auto">
        <Skeleton className="mx-0.5 h-8 flex-1 rounded-full bg-white/10 sm:h-9 sm:min-w-[4.5rem]" />
        <Skeleton className="mx-0.5 h-8 flex-1 rounded-full bg-white/10 sm:h-9 sm:min-w-[5rem]" />
        <Skeleton className="mx-0.5 h-8 flex-1 rounded-full bg-white/10 sm:h-9 sm:min-w-[3.5rem]" />
      </div>
    </div>
  )
}

export function TripSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <TripSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/** Header chrome while trips shell loads (matches `FloatingHeader` `variant="inline"`). */
export function FloatingHeaderSkeleton() {
  return (
    <div className="relative z-30 flex w-full justify-center px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className={cn(
          "flex w-full max-w-7xl flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-2.5",
          "border-border/40 bg-gradient-to-br from-card/50 via-card/22 to-card/10 backdrop-blur-2xl",
          "dark:border-white/15 dark:from-white/[0.14] dark:via-white/[0.07] dark:to-transparent",
        )}
      >
        <Skeleton className="h-9 w-[11.5rem] shrink-0 rounded-full bg-white/10 sm:w-60" />
        <Skeleton className="order-4 h-9 w-full min-w-0 rounded-full bg-white/10 sm:order-2 sm:flex-1 sm:w-auto" />
        <div className="order-2 ml-auto flex shrink-0 gap-1 sm:order-3 sm:ml-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-white/10" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}

/** Filters + grid — used inside `TripsList` when `loading` and in route `loading.tsx` body below header. */
export function TripsListBodySkeleton({ tripCardCount = 6 }: { tripCardCount?: number }) {
  return (
    <>
      <TripFiltersSkeleton />
      <TripSkeletonGrid count={tripCardCount} />
    </>
  )
}
