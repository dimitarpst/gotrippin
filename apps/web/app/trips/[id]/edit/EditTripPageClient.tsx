"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import CreateTrip from "@/components/trips/create-trip";
import { TripScheduleRepairDrawer } from "@/components/trips/trip-schedule-repair-drawer";
import { toast } from "sonner";
import { updateTripAction } from "@/actions/trips";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";
import type { Activity, Trip, TripLocation, TripUpdateData } from "@gotrippin/core";
import {
  getGroupedActivities,
  normalizeTimelineData,
  type GroupedActivitiesResponse,
} from "@/lib/api/activities";
import { getLocations } from "@/lib/api/trip-locations";
import { shiftTripRelatedDatesByCalendarDays } from "@/lib/shift-trip-related-dates";
import { computeTripStartCalendarDayDelta } from "@/lib/trip-date-shift-calendar";
import type { DatePickerTimelineContext } from "@/components/trips/date-picker";
import { findTripScheduleViolations } from "@/lib/trip-schedule-bounds";

type ScheduleRepairState = {
  tripStart: Date;
  tripEnd: Date;
  rollback: { start_date: string | null; end_date: string | null } | null;
  calendarDayDeltaApplied: number;
  locations: TripLocation[];
  activities: Activity[];
};

interface EditTripPageClientProps {
  trip: Trip;
  shareCode: string;
  /** Route + activities for date picker dots (same source as trip detail). */
  datePickerTimelineContext: DatePickerTimelineContext;
}

export default function EditTripPageClient({
  trip,
  shareCode,
  datePickerTimelineContext,
}: EditTripPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [scheduleRepair, setScheduleRepair] = useState<ScheduleRepairState | null>(null);
  const [repairDrawerOpen, setRepairDrawerOpen] = useState(false);
  const [repairSaving, setRepairSaving] = useState(false);
  const repairResolvedRef = useRef(false);
  const scheduleRepairRef = useRef<ScheduleRepairState | null>(null);

  useEffect(() => {
    scheduleRepairRef.current = scheduleRepair;
  }, [scheduleRepair]);

  const beginScheduleRepair = useCallback((state: ScheduleRepairState) => {
    setScheduleRepair(state);
    setRepairDrawerOpen(true);
  }, []);

  const rollbackFromSnapshot = useCallback(
    async (snapshot: ScheduleRepairState) => {
      if (!trip?.id || snapshot.rollback === null) {
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
        console.error("EditTripPageClient: rollback failed", err);
        toast.error(t("trips.schedule_repair_rollback_failed"), {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [trip?.id, router, t]
  );

  const handleScheduleRepairOpenChange = useCallback((open: boolean) => {
    if (open) {
      setRepairDrawerOpen(true);
      return;
    }
    setRepairDrawerOpen(false);
  }, []);

  const handleScheduleRepairCloseComplete = useCallback(() => {
    const snapshot = scheduleRepairRef.current;
    const resolved = repairResolvedRef.current;

    if (resolved) {
      repairResolvedRef.current = false;
      setScheduleRepair(null);
      toast.success(t("trips.update_success", { defaultValue: "Trip updated successfully!" }));
      router.push(`/trips/${shareCode}`);
      return;
    }

    setScheduleRepair(null);
    if (snapshot !== null && snapshot.rollback !== null) {
      void rollbackFromSnapshot(snapshot);
    }
  }, [rollbackFromSnapshot, router, shareCode, t]);

  const handleScheduleRepaired = useCallback(() => {
    repairResolvedRef.current = true;
    setRepairDrawerOpen(false);
  }, []);

  const handleSave = async (data: {
    title: string;
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput;
    coverUploadStorageKey?: string;
    color?: string;
    dateRange?: DateRange;
  }) => {
    try {
      const tripData: Record<string, unknown> = {};

      if (data.title !== trip.title) tripData.title = data.title;
      if (data.coverUploadStorageKey) tripData.cover_upload_storage_key = data.coverUploadStorageKey;
      else if (data.coverPhoto) tripData.cover_photo = data.coverPhoto;
      if (data.color !== trip.color) tripData.color = data.color;

      if (data.dateRange?.from) {
        const newStartDate = data.dateRange.from.toISOString();
        if (newStartDate !== trip.start_date) tripData.start_date = newStartDate;
      } else if (trip.start_date) {
        tripData.start_date = null;
      }

      if (data.dateRange?.to) {
        const newEndDate = data.dateRange.to.toISOString();
        if (newEndDate !== trip.end_date) tripData.end_date = newEndDate;
      } else if (trip.end_date) {
        tripData.end_date = null;
      }

      if (!trip.id) return;

      const rollback = {
        start_date: trip.start_date ?? null,
        end_date: trip.end_date ?? null,
      };

      const previousStartIso = trip.start_date;
      const nextFrom = data.dateRange?.from;
      const calendarDayDelta =
        previousStartIso && nextFrom
          ? computeTripStartCalendarDayDelta(previousStartIso, nextFrom)
          : null;

      const hasDateUpdate = "start_date" in tripData || "end_date" in tripData;

      const result = await updateTripAction(trip.id, tripData as TripUpdateData);

      if (!result.success) {
        toast.error(t("trips.update_failed", { defaultValue: "Failed to update trip" }), {
          description: result.error,
        });
        return;
      }

      let appliedDelta = 0;
      if (calendarDayDelta !== null && calendarDayDelta !== 0) {
        try {
          const [locations, grouped] = await Promise.all([
            getLocations(trip.id),
            getGroupedActivities(trip.id),
          ]);
          const { activitiesByLocation, unassigned } = normalizeTimelineData(
            grouped as GroupedActivitiesResponse
          );
          await shiftTripRelatedDatesByCalendarDays(
            trip.id,
            calendarDayDelta,
            locations,
            activitiesByLocation,
            unassigned
          );
          appliedDelta = calendarDayDelta;
        } catch (err) {
          console.error("EditTripPageClient: shift related dates failed", err);
          toast.error(t("trips.dates_shift_partial_failed"), {
            description: err instanceof Error ? err.message : String(err),
          });
          router.push(`/trips/${shareCode}`);
          return;
        }
      }

      const pickerRange = data.dateRange;
      const shouldCheckViolations =
        hasDateUpdate && pickerRange?.from && pickerRange?.to;

      if (shouldCheckViolations && pickerRange.from && pickerRange.to) {
        try {
          const [locs, grouped] = await Promise.all([
            getLocations(trip.id),
            getGroupedActivities(trip.id),
          ]);
          const norm = normalizeTimelineData(grouped as GroupedActivitiesResponse);
          const violations = findTripScheduleViolations(
            pickerRange.from,
            pickerRange.to,
            locs,
            norm.activitiesByLocation,
            norm.unassigned
          );

          if (violations.locations.length > 0 || violations.activities.length > 0) {
            beginScheduleRepair({
              tripStart: pickerRange.from,
              tripEnd: pickerRange.to,
              rollback,
              calendarDayDeltaApplied: appliedDelta,
              locations: violations.locations,
              activities: violations.activities,
            });
            toast.info(t("trips.schedule_repair_needed"));
            return;
          }
        } catch (err) {
          console.error("EditTripPageClient: schedule violation check failed", err);
          toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
            description: err instanceof Error ? err.message : String(err),
          });
        }
      }

      toast.success(t("trips.update_success", { defaultValue: "Trip updated successfully!" }));
      router.push(`/trips/${shareCode}`);
    } catch (error) {
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleBack = () => {
    router.push(`/trips/${shareCode}`);
  };

  const initialData = {
    title: trip.title || "",
    initialCoverPhoto: (trip as Trip & { cover_photo?: unknown }).cover_photo ?? null,
    color: trip.color ?? undefined,
    dateRange:
      trip.start_date && trip.end_date
        ? { from: new Date(trip.start_date), to: new Date(trip.end_date) }
        : undefined,
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <AuroraBackground />

      <div className="relative z-10 flex-1">
        <CreateTrip
          onBack={handleBack}
          onSave={handleSave}
          initialData={initialData}
          isEditing={true}
          datePickerTimelineContext={datePickerTimelineContext}
        />
      </div>

      {scheduleRepair && trip.id ? (
        <TripScheduleRepairDrawer
          open={repairDrawerOpen}
          onOpenChange={handleScheduleRepairOpenChange}
          onDrawerCloseComplete={handleScheduleRepairCloseComplete}
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
