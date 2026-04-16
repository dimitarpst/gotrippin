import AuroraBackground from "@/components/effects/aurora-background";
import DockBar from "@/components/layout/DockBar";
import {
  FloatingHeaderSkeleton,
  TripsListBodySkeleton,
} from "@/components/trips/trip-skeleton";

/** Shown during client navigations to `/trips` while the server component resolves. */
export default function TripsLoading() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <AuroraBackground />
      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <FloatingHeaderSkeleton />
        <div className="relative flex-1">
          <TripsListBodySkeleton />
        </div>
      </div>
      <DockBar />
    </main>
  );
}
