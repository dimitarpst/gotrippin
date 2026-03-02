"use client";

import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import ActivityForm from "@/components/trips/activity-form";
import type { Trip, ActivityType } from "@gotrippin/core";

interface NewActivityPageClientProps {
  trip: Trip;
  shareCode: string;
  initialType: string;
}

export default function NewActivityPageClient({ trip, shareCode, initialType }: NewActivityPageClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(`/trips/${shareCode}/activity`);
  };

  const handleSave = () => {
    router.push(`/trips/${shareCode}`);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <ActivityForm 
          tripId={trip.id} 
          onBack={handleBack} 
          onSave={handleSave}
          initialType={initialType as ActivityType}
        />
      </div>
    </main>
  );
}
