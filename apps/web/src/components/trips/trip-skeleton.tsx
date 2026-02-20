"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TripSkeleton() {
  return (
    <Card className="border-white/[0.08] rounded-2xl overflow-hidden shadow-lg bg-[var(--surface)] backdrop-blur-xl">
      {/* Image/Color area */}
      <Skeleton className="relative h-48 overflow-hidden rounded-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Days until badge skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 bg-white/10 rounded-full" />
        </div>
      </Skeleton>

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-5 bg-white/10 rounded w-3/4" />
        
        {/* Date range skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 bg-white/10 rounded" />
          <Skeleton className="h-4 bg-white/10 rounded w-32" />
        </div>
        
        {/* Location skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 bg-white/10 rounded" />
          <Skeleton className="h-4 bg-white/10 rounded w-24" />
        </div>
      </div>
    </Card>
  )
}

export function TripSkeletonGrid() {
  return (
    <div className="px-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <TripSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

