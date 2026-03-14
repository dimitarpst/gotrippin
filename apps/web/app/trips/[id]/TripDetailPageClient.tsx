"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AuroraBackground from "@/components/effects/aurora-background";
import TripOverview from "@/components/trips/trip-overview";
import type {
  TripOverviewActions,
  TripOverviewTimeline,
  TripOverviewWeather,
} from "@/components/trips/trip-overview";
import { updateTripAction, deleteTripAction } from "@/actions/trips";
import { toast } from "sonner";
import type { Trip, TripLocation, Activity, TripLocationWeather } from "@gotrippin/core";
import type { DateRange } from "react-day-picker";

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
}: TripDetailPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

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
      onChangeDates: async (dateRange: DateRange | undefined) => {
        if (!trip?.id || !dateRange?.from) return;
        const result = await updateTripAction(trip.id, {
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to ? dateRange.to.toISOString() : null,
        });
        if (result.success) {
          toast.success(t("trips.dates_updated"));
          router.refresh();
        } else {
          toast.error(t("trips.dates_update_failed"), { description: result.error });
        }
      },
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
    [trip?.id, shareCode, router, t]
  );

  const timeline: TripOverviewTimeline = useMemo(
    () => ({
      routeLocations,
      timelineLocations,
      activitiesByLocation,
      error: locationsError || activitiesError || null,
      onRefetch: async () => router.refresh(),
    }),
    [routeLocations, timelineLocations, activitiesByLocation, locationsError, activitiesError, router]
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
    </main>
  );
}
