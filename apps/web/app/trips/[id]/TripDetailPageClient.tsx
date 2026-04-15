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
import { TripItineraryDrawer } from "@/components/trips/trip-itinerary-drawer";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteTripByEmail, ApiError } from "@/lib/api/trips";

type ScheduleRepairState = {
  tripStart: Date;
  tripEnd: Date;
  /** When set, closing the drawer without saving reverts the trip date change. `null` when opened from the overview banner (already saved dates). */
  rollback: { start_date: string | null; end_date: string | null } | null;
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
  /** Open itinerary drawer on load (e.g. `/trips/x?itinerary=1`). */
  initialItineraryOpen?: boolean;
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
  initialItineraryOpen = false,
}: TripDetailPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [itineraryDrawerOpen, setItineraryDrawerOpen] = useState(initialItineraryOpen);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

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

  const itineraryLocations = useMemo(() => {
    const raw = timelineLocations.length > 0 ? timelineLocations : routeLocations;
    return [...raw].sort((a, b) => a.order_index - b.order_index);
  }, [timelineLocations, routeLocations]);

  const handleItineraryDrawerOpenChange = useCallback(
    (open: boolean) => {
      setItineraryDrawerOpen(open);
      if (!open) {
        router.replace(`/trips/${shareCode}`, { scroll: false });
      }
    },
    [router, shareCode],
  );

  const scheduleNeedsAttention = useMemo(() => {
    if (!trip.start_date || !trip.end_date) {
      return null;
    }
    const from = new Date(trip.start_date);
    const to = new Date(trip.end_date);
    const locs = timelineLocations.length > 0 ? timelineLocations : routeLocations;
    const v = findTripScheduleViolations(from, to, locs, activitiesByLocation, unassignedActivities);
    if (v.locations.length === 0 && v.activities.length === 0) {
      return null;
    }
    return {
      itemCount: v.locations.length + v.activities.length,
      stopCount: v.locations.length,
      activityCount: v.activities.length,
    };
  }, [
    trip.start_date,
    trip.end_date,
    timelineLocations,
    routeLocations,
    activitiesByLocation,
    unassignedActivities,
  ]);

  const openScheduleRepairFromBanner = useCallback(() => {
    if (!trip.start_date || !trip.end_date || !trip.id) {
      return;
    }
    const from = new Date(trip.start_date);
    const to = new Date(trip.end_date);
    const locs = timelineLocations.length > 0 ? timelineLocations : routeLocations;
    const v = findTripScheduleViolations(from, to, locs, activitiesByLocation, unassignedActivities);
    if (v.locations.length === 0 && v.activities.length === 0) {
      return;
    }
    beginScheduleRepair({
      tripStart: from,
      tripEnd: to,
      rollback: null,
      calendarDayDeltaApplied: 0,
      locations: v.locations,
      activities: v.activities,
    });
  }, [
    beginScheduleRepair,
    trip.id,
    trip.start_date,
    trip.end_date,
    timelineLocations,
    routeLocations,
    activitiesByLocation,
    unassignedActivities,
  ]);

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

      try {
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
          beginScheduleRepair({
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
      } catch (err) {
        console.error("TripDetailPageClient: schedule violation check failed", err);
        toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }), {
          description: err instanceof Error ? err.message : String(err),
        });
        router.refresh();
      }
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
      beginScheduleRepair,
    ]
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
      router.refresh();
      return;
    }

    setScheduleRepair(null);
    if (snapshot !== null && snapshot.rollback !== null) {
      void rollbackFromSnapshot(snapshot);
    }
  }, [rollbackFromSnapshot, router]);

  const handleScheduleRepaired = useCallback(() => {
    repairResolvedRef.current = true;
    setRepairDrawerOpen(false);
  }, []);

  const handleInviteSend = useCallback(async () => {
    if (!trip?.id) return;
    const trimmed = inviteEmail.trim();
    if (!trimmed) {
      toast.error(t("trips.invite_email_empty"));
      return;
    }
    setInviteSending(true);
    try {
      await inviteTripByEmail(trip.id, trimmed);
      toast.success(t("trips.invite_sent"));
      setInviteOpen(false);
      setInviteEmail("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("trips.invite_failed");
      console.error("TripDetailPageClient: inviteTripByEmail failed", err);
      toast.error(t("trips.invite_failed"), { description: msg });
    } finally {
      setInviteSending(false);
    }
  }, [trip?.id, inviteEmail, t]);

  const actions: TripOverviewActions = useMemo(
    () => ({
      onNavigate: (screen) => {
        if (screen === "flight") {
          router.push(`/trips/${shareCode}/activity/new?type=flight`);
          return;
        }
        if (screen === "lodging") {
          router.push(`/trips/${shareCode}/activity/new?type=accommodation`);
          return;
        }
        if (screen === "place") {
          router.push(`/trips/${shareCode}/activity/new?type=custom`);
          return;
        }
        if (screen === "timeline") {
          setItineraryDrawerOpen(true);
          return;
        }
        const routes: Record<string, string> = {
          activity: `/trips/${shareCode}/activity`,
          weather: `/trips/${shareCode}/weather`,
          map: `/trips/${shareCode}/map`,
          gallery: `/trips/${shareCode}/gallery`,
          notes: `/trips/${shareCode}/notes`,
          budget: `/trips/${shareCode}/budget`,
        };
        const path = routes[screen];
        if (path) router.push(path);
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
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${origin}/trips/${shareCode}/join`;
        void navigator.clipboard.writeText(url).then(
          () => {
            toast.success(t("trips.share_link_copied"));
          },
          (err: unknown) => {
            console.error("TripDetailPageClient: clipboard write failed", err);
            toast.error(t("trips.invite_failed"), { description: String(err) });
          }
        );
      },
      onInviteByEmail: () => {
        setInviteOpen(true);
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
      onExportTripPdf: () => {
        const url = `/trips/${shareCode}/print?autoprint=1`;
        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (!w) {
          toast.error(t("trips.export_pdf_failed"), {
            description: t("trips.export_pdf_popup_blocked"),
          });
          return;
        }
        toast.success(t("trips.export_pdf_success"));
      },
    }),
    [
      trip,
      routeLocations,
      activitiesByLocation,
      unassignedActivities,
      shareCode,
      router,
      t,
      handleChangeDates,
    ]
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
          scheduleAttention={
            scheduleRepair !== null || scheduleNeedsAttention === null
              ? undefined
              : {
                  itemCount: scheduleNeedsAttention.itemCount,
                  stopCount: scheduleNeedsAttention.stopCount,
                  activityCount: scheduleNeedsAttention.activityCount,
                  onReview: openScheduleRepairFromBanner,
                }
          }
        />
      </div>

      <TripItineraryDrawer
        open={itineraryDrawerOpen}
        onOpenChange={handleItineraryDrawerOpenChange}
        trip={trip}
        shareCode={shareCode}
        locations={itineraryLocations}
        activitiesByLocation={activitiesByLocation}
        onAfterReorder={() => router.refresh()}
      />

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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("trip_overview.invite_dialog_title")}</DialogTitle>
            <DialogDescription>{t("trip_overview.invite_dialog_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium" htmlFor="trip-invite-email">
              {t("trip_overview.invite_email_label")}
            </label>
            <Input
              id="trip-invite-email"
              type="email"
              autoComplete="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t("trip_overview.invite_email_placeholder")}
              disabled={inviteSending}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={inviteSending}
            >
              {t("trips.cancel")}
            </Button>
            <Button type="button" onClick={() => void handleInviteSend()} disabled={inviteSending}>
              {t("trip_overview.invite_email_send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
