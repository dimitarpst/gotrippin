"use client";

import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import ActivityForm from "@/components/trips/activity-form";
import type { Trip, Activity } from "@gotrippin/core";

interface EditActivityPageClientProps {
  trip: Trip;
  shareCode: string;
  activity: Activity;
}

export default function EditActivityPageClient({ trip, shareCode, activity }: EditActivityPageClientProps) {
  const router = useRouter();

  const handleBack = () => {
    // Go back to the timeline or location page where they came from
    router.back();
  };

  const handleSave = () => {
    router.push(`/trips/${shareCode}/timeline`);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <ActivityForm 
          tripId={trip.id} 
          activity={activity}
          onBack={handleBack} 
          onSave={handleSave}
        />
      </div>
    </main>
  );
}
