"use client";

import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import ActivitySelector from "@/components/trips/activity-selector";
import type { Trip } from "@gotrippin/core";

interface ActivityPageClientProps {
  trip: Trip;
  shareCode: string;
}

export default function ActivityPageClient({ trip, shareCode }: ActivityPageClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/trips/${shareCode}`);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <ActivitySelector
          tripId={trip.id}
          shareCode={shareCode}
          onBack={handleBack}
        />
      </div>
    </main>
  );
}
