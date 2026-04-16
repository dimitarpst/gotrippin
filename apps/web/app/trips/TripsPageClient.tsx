"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { Trip } from "@gotrippin/core";
import AuroraBackground from "@/components/effects/aurora-background";
import FloatingHeader, { type TripsListScope } from "@/components/layout/FloatingHeader";
import DockBar from "@/components/layout/DockBar";
import TripsList from "@/components/trips/trips-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TripsPageClientProps {
  trips: Trip[];
  error: string | null;
}

function tripHasOtherMembers(trip: Trip, userId: string): boolean {
  const pile = trip.member_facepile ?? [];
  return pile.some((m) => m.user_id !== userId);
}

/**
 * My trips: you are the recorded creator, or legacy rows with no `created_by` (treat as yours).
 * Shared: trips others created that you joined, or trips you own and invited someone else (facepile has another member).
 */
function filterTripsByScope(trips: Trip[], scope: TripsListScope, userId: string | undefined): Trip[] {
  if (!userId) {
    return trips;
  }
  if (scope === "my_trips") {
    return trips.filter((t) => t.created_by === undefined || t.created_by === null || t.created_by === userId);
  }
  return trips.filter((t) => {
    const joinedSomeoneElses =
      t.created_by !== undefined && t.created_by !== null && t.created_by !== userId;
    const iCreated =
      t.created_by === undefined || t.created_by === null || t.created_by === userId;
    const sharedMineWithOthers = iCreated && tripHasOtherMembers(t, userId);
    return joinedSomeoneElses || sharedMineWithOthers;
  });
}

export default function TripsPageClient({
  trips,
  error,
}: TripsPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [listScope, setListScope] = useState<TripsListScope>("my_trips");
  const [scopeTransition, setScopeTransition] = useState(false);
  const scopeTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginScopeTransition = useCallback(() => {
    setScopeTransition(true);
    if (scopeTransitionTimer.current !== null) {
      clearTimeout(scopeTransitionTimer.current);
    }
    scopeTransitionTimer.current = setTimeout(() => {
      setScopeTransition(false);
      scopeTransitionTimer.current = null;
    }, 340);
  }, []);

  const scopedTrips = useMemo(
    () => filterTripsByScope(trips, listScope, user?.id),
    [trips, listScope, user?.id]
  );

  const handleSelectTrip = (shareCode: string) => {
    router.push(`/trips/${shareCode}`);
  };

  const handleCreateTrip = () => {
    router.push("/trips/create");
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <AuroraBackground />
      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <FloatingHeader
          variant="inline"
          hideOnScroll={false}
          tripsScope={listScope}
          onTripsScopeChange={(next) => {
            beginScopeTransition();
            setListScope(next);
          }}
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: t("trips.search_placeholder", "Search trips..."),
          }}
        />

        <div className="relative flex-1">
          {error ? (
            <div className="absolute left-1/2 top-2 z-20 w-full max-w-md -translate-x-1/2 px-4">
              <Alert variant="destructive" className="bg-destructive/10 backdrop-blur-md border-destructive/20">
                <AlertCircle className="size-4" />
                <AlertDescription>{t(error, { defaultValue: error })}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <TripsList
            trips={scopedTrips}
            viewerUserId={user?.id}
            loading={authLoading || scopeTransition}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={handleCreateTrip}
            controlledSearch={{ value: searchQuery, onChange: setSearchQuery }}
          />
        </div>
      </div>

      <DockBar onCreateTrip={handleCreateTrip} />
    </main>
  );
}
