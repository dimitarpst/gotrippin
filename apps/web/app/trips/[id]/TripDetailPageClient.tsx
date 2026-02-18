"use client";

import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/effects/aurora-background";
import TripOverview from "@/components/trips/trip-overview";
import { updateTripAction, deleteTripAction } from "@/actions/trips";
import type { Trip, TripLocation, Activity, TripLocationWeather } from "@gotrippin/core";
import type { DateRange } from "react-day-picker";

interface TripDetailPageClientProps {
  trip: Trip;
  routeLocations: TripLocation[];
  timelineLocations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  unassignedActivities: Activity[];
  weatherByLocation: Record<string, TripLocationWeather>;
  weatherFetchedAt: number | null;
  shareCode: string;
}

export default function TripDetailPageClient({
  trip,
  routeLocations,
  timelineLocations,
  activitiesByLocation,
  unassignedActivities,
  weatherByLocation,
  weatherFetchedAt,
  shareCode,
}: TripDetailPageClientProps) {
  const router = useRouter();

  const handleNavigate = (screen: string) => {
    if (screen === "activity") {
      router.push(`/trips/${shareCode}/activity`);
    } else if (screen === "flight") {
      router.push(`/trips/${shareCode}/activity/flight`);
    } else if (screen === "timeline") {
      router.push(`/trips/${shareCode}/timeline`);
    } else if (screen === "weather") {
      router.push(`/trips/${shareCode}/weather`);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  const handleEdit = () => {
    router.push(`/trips/${shareCode}/edit`);
  };

  const handleDelete = async () => {
    if (!trip?.id) return;
    const result = await deleteTripAction(trip.id);
    if (result.success) {
      router.push("/");
    } else {
      console.error("Failed to delete trip:", result.error);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  const handleManageGuests = () => {
    // TODO: Implement manage guests functionality
  };

  const handleEditName = () => {
    router.push(`/trips/${shareCode}/edit`);
  };

  const handleChangeDates = async (dateRange: DateRange | undefined) => {
    if (!trip?.id || !dateRange?.from) return;

    const updateData = {
      start_date: dateRange.from ? dateRange.from.toISOString() : null,
      end_date: dateRange.to ? dateRange.to.toISOString() : null,
    };

    const result = await updateTripAction(trip.id, updateData);
    if (result.success) {
      router.refresh();
    } else {
      console.error("Failed to update dates:", result.error);
    }
  };

  const handleChangeBackground = async (type: "image" | "color", value: string) => {
    if (!trip?.id) return;

    const updateData =
      type === "image"
        ? { image_url: value, color: null }
        : { color: value, image_url: null };

    const result = await updateTripAction(trip.id, updateData);
    if (result.success) {
      router.refresh();
    } else {
      console.error("Failed to update background:", result.error);
    }
  };

  const handleOpenLocation = (locationId: string) => {
    router.push(`/trips/${shareCode}/timeline/${locationId}`);
  };

  const handleRefetchTimeline = async () => {
    router.refresh();
  };

  const handleRefetchWeather = async () => {
    router.refresh();
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />
      <div className="flex-1 relative z-10">
        <TripOverview
          key={`${trip.id}-${trip.image_url || trip.color || "default"}-${trip.start_date || ""}-${trip.end_date || ""}`}
          trip={trip}
          onNavigate={handleNavigate}
          onOpenLocation={handleOpenLocation}
          onBack={handleBack}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShare={handleShare}
          onManageGuests={handleManageGuests}
          onEditName={handleEditName}
          onChangeDates={handleChangeDates}
          onChangeBackground={handleChangeBackground}
          routeLocations={routeLocations}
          routeLoading={false}
          timelineLocations={timelineLocations}
          activitiesByLocation={activitiesByLocation}
          timelineLoading={false}
          timelineError={null}
          unassignedActivities={unassignedActivities}
          onRefetchTimeline={handleRefetchTimeline}
          weatherByLocation={weatherByLocation}
          weatherFetchedAt={weatherFetchedAt}
          weatherLoading={false}
          weatherError={null}
          onRefetchWeather={handleRefetchWeather}
        />
      </div>
    </main>
  );
}
