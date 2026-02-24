"use client";

import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import LodgingForm from "@/components/trips/lodging-form";
import type { Trip } from "@gotrippin/core";

interface LodgingPageClientProps {
  trip: Trip;
  shareCode: string;
}

export default function LodgingPageClient({ trip, shareCode }: LodgingPageClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/trips/${shareCode}/activity`);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <LodgingForm tripId={trip.id} onBack={handleBack} />
      </div>
    </main>
  );
}
