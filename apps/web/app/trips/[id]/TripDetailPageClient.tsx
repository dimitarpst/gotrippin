"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AuroraBackground from "@/components/effects/aurora-background";
import TripOverview from "@/components/trips/trip-overview";
import type {
  TripOverviewActions,
  TripOverviewTimeline,
  TripOverviewWeather,
} from "@/components/trips/trip-overview";
import { TripScheduleRepairDrawer } from "@/components/trips/trip-schedule-repair-drawer";
import { updateTripAction, deleteTripAction } from "@/actions/trips";
import { toast } from "sonner";
import { computeTripStartCalendarDayDelta } from "@/lib/trip-date-shift-calendar";
import type { Trip, TripLocation, Activity, TripLocationWeather } from "@gotrippin/core";
import type { DateRange } from "react-day-picker";
import { shiftTripRelatedDatesByCalendarDays } from "@/lib/shift-trip-related-dates";
import { getGroupedActivities, normalizeTimelineData, type GroupedActivitiesResponse } from "@/lib/api/activities";
import { getLocations } from "@/lib/api/trip-locations";
import { findTripScheduleViolations } from "@/lib/trip-schedule-bounds";

type ScheduleRepairState = {
  tripStart: Date;
  tripEnd: Date;
  rollback: { start_date: string | null; end_date: string | null };
  calendarDayDeltaApplied: number;
  locations: TripLocation[];
  activities: Activity[];
};

interface TripDetailPageClientProps {
  trip: Trip;
  routeLocations: TripLocation[];
  timelineLocations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  weatherByLocation: Record<string, TripLocationWeather>;
  weatherFetchedAt: number | null;
  locationsError: string | null;
  activitiesError: string | null;
  weatherError: string | null;
  shareCode: string;
  unassignedActivities: Activity[];
}

export default function TripDetailPageClient({
  trip,
  routeLocations,
  timelineLocations,
  activitiesByLocation,
  weatherByLocation,
  weatherFetchedAt,
  locationsError,
  activitiesError,
  weatherError,
  shareCode,
  unassignedActivities,
}: TripDetailPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [scheduleRepair, setScheduleRepair] = useState<ScheduleRepairState | null>(null);
  const [repairSaving, setRepairSaving] = useState(false);
  const repairResolvedRef = useRef(false);
  const scheduleRepairRef = useRef<ScheduleRepairState | null>(null);

  useEffect(() => {
    scheduleRepairRef.current = scheduleRepair;
  }, [scheduleRepair]);

  const rollbackFromSnapshot = useCallback(
    async (snapshot: ScheduleRepairState) => {
      if (!trip?.id) {
        return;
      }
      try {
        const result = await updateTripAction(trip.id, {
          start_date: snapshot.rollback.start_date,
          end_date: snapshot.rollback.end_date,
        });
        if (!result.success) {
          toast.error(t("trips.dates_update_failed"), { description: result.error });
          return;
        }
        if (snapshot.calendarDayDeltaApplied !== 0) {
          const [locs, grouped] = await Promise.all([
            getLocations(trip.id),
            getGroupedActivities(trip.id),
          ]);
          const norm = normalizeTimelineData(grouped as GroupedActivitiesResponse);
          await shiftTripRelatedDatesByCalendarDays(
            trip.id,
            -snapshot.calendarDayDeltaApplied,
            locs,
            norm.activitiesByLocation,
            norm.unassigned
          );
        }
        toast.info(t("trips.schedule_repair_rolled_back"));
        router.refresh();
      } catch (err) {
        console.error("TripDetailPageClient: rollback failed", err);
        toast.error(t("trips.schedule_repair_rollback_failed"), {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [trip?.id, router, t]
  );

  const handleChangeDates = useCallback(
    async (dateRange: DateRange | undefined) => {
      if (!trip?.id || !dateRange?.from || !dateRange.to) {
        return;
      }

      const rollback = {
        start_date: trip.start_date ?? null,
        end_date: trip.end_date ?? null,
      };

      const previousStartIso = trip.start_date;
      const calendarDayDelta =
        previousStartIso && dateRange.from
          ? computeTripStartCalendarDayDelta(previousStartIso, dateRange.from)
          : null;

      const result = await updateTripAction(trip.id, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      });
      if (!result.success) {
        toast.error(t("trips.dates_update_failed"), { description: result.error });
        return;
      }

      let appliedDelta = 0;
      if (calendarDayDelta !== null && calendarDayDelta !== 0) {
        try {
          await shiftTripRelatedDatesByCalendarDays(
            trip.id,
            calendarDayDelta,
            routeLocations,
            activitiesByLocation,
            unassignedActivities
          );
          appliedDelta = calendarDayDelta;
        } catch (err) {
          console.error("TripDetailPageClient: shift related dates failed", err);
          toast.error(t("trips.dates_shift_partial_failed"), {
            description: err instanceof Error ? err.message : String(err),
          });
          router.refresh();
          return;
        }
      }

      const [locs, grouped] = await Promise.all([
        getLocations(trip.id),
        getGroupedActivities(trip.id),
      ]);
      const norm = normalizeTimelineData(grouped as GroupedActivitiesResponse);
      const violations = findTripScheduleViolations(
        dateRange.from,
        dateRange.to,
        locs,
        norm.activitiesByLocation,
        norm.unassigned
      );

      if (violations.locations.length > 0 || violations.activities.length > 0) {
        setScheduleRepair({
          tripStart: dateRange.from,
          tripEnd: dateRange.to,
          rollback,
          calendarDayDeltaApplied: appliedDelta,
          locations: violations.locations,
          activities: violations.activities,
        });
        toast.info(t("trips.schedule_repair_needed"));
        return;
      }

      toast.success(t("trips.dates_updated"));
      router.refresh();
    },
    [
      trip?.id,
      trip.start_date,
      trip.end_date,
      routeLocations,
      activitiesByLocation,
      unassignedActivities,
      router,
      t,
    ]
  );

  const handleScheduleRepairOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (repairResolvedRef.current) {
          repairResolvedRef.current = false;
          setScheduleRepair(null);
          return;
        }
        const snapshot = scheduleRepairRef.current;
        setScheduleRepair(null);
        if (snapshot) {
          void rollbackFromSnapshot(snapshot);
        }
      }
    },
    [rollbackFromSnapshot]
  );

  const handleScheduleRepaired = useCallback(() => {
    repairResolvedRef.current = true;
    setScheduleRepair(null);
    router.refresh();
  }, [router]);

  const actions: TripOverviewActions = useMemo(
    () => ({
      onNavigate: (screen) => {
        const routes: Record<string, string> = {
          activity: `/trips/${shareCode}/activity`,
          flight: `/trips/${shareCode}/activity/flight`,
          timeline: `/trips/${shareCode}/timeline`,
          weather: `/trips/${shareCode}/weather`,
          map: `/trips/${shareCode}/map`,
        };
        if (routes[screen]) router.push(routes[screen]);
      },
      onBack: () => router.push("/trips"),
      onEdit: () => router.push(`/trips/${shareCode}/edit`),
      onDelete: async () => {
        if (!trip?.id) return;
        const result = await deleteTripAction(trip.id);
        if (result.success) {
          toast.success(t("trips.delete_success"));
          router.push("/trips");
        } else {
          toast.error(t("trips.delete_failed"), { description: result.error });
        }
      },
      onShare: () => {
        // TODO: Implement share functionality
      },
      onManageGuests: () => {
        // TODO: Implement manage guests functionality
      },
      onEditName: () => router.push(`/trips/${shareCode}/edit`),
      onOpenLocation: (locationId) =>
        router.push(`/trips/${shareCode}/timeline/${locationId}`),
      onChangeDates: handleChangeDates,
      onChangeBackground: async (_type, coverPhoto) => {
        if (!trip?.id) return;
        const result = await updateTripAction(trip.id, { cover_photo: coverPhoto, color: undefined });
        if (result.success) {
          toast.success(t("trips.background_updated"));
          router.refresh();
        } else {
          toast.error(t("trips.background_update_failed"), { description: result.error });
        }
      },
      onChangeBackgroundUpload: async ({ storage_key }) => {
        if (!trip?.id) return;
        const result = await updateTripAction(trip.id, {
          cover_upload_storage_key: storage_key,
          color: undefined,
        });
        if (result.success) {
          toast.success(t("trips.background_updated"));
          router.refresh();
        } else {
          toast.error(t("trips.background_update_failed"), { description: result.error });
        }
      },
      onChangeBackgroundColor: async (color) => {
        if (!trip?.id) return;
        const result = await updateTripAction(trip.id, { color, cover_photo: undefined });
        if (result.success) {
          toast.success(t("trips.color_updated"));
          router.refresh();
        } else {
          toast.error(t("trips.color_update_failed"), { description: result.error });
        }
      },
    }),
    [trip?.id, shareCode, router, t, handleChangeDates]
  );

  const timeline: TripOverviewTimeline = useMemo(
    () => ({
      routeLocations,
      timelineLocations,
      activitiesByLocation,
      unassignedActivities,
      error: locationsError || activitiesError || null,
      onRefetch: async () => router.refresh(),
    }),
    [
      routeLocations,
      timelineLocations,
      activitiesByLocation,
      unassignedActivities,
      locationsError,
      activitiesError,
      router,
    ]
  );

  const weather: TripOverviewWeather = useMemo(
    () => ({
      byLocation: weatherByLocation,
      fetchedAt: weatherFetchedAt,
      error: weatherError,
      onRefetch: async () => router.refresh(),
    }),
    [weatherByLocation, weatherFetchedAt, weatherError, router]
  );

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <TripOverview
          key={`${trip.id}-${trip.image_url || trip.color || "default"}-${trip.start_date || ""}-${trip.end_date || ""}`}
          trip={trip}
          actions={actions}
          timeline={timeline}
          weather={weather}
        />
      </div>

      {scheduleRepair && trip.id ? (
        <TripScheduleRepairDrawer
          open
          onOpenChange={handleScheduleRepairOpenChange}
          tripId={trip.id}
          tripStart={scheduleRepair.tripStart}
          tripEnd={scheduleRepair.tripEnd}
          locations={scheduleRepair.locations}
          activities={scheduleRepair.activities}
          saving={repairSaving}
          setSaving={setRepairSaving}
          onRepaired={handleScheduleRepaired}
        />
      ) : null}
    </main>
  );
}
