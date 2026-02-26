"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Map as MapIcon, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip, TripLocation, UpdateTripLocation } from "@gotrippin/core";
import { MapView, tripLocationsToWaypoints } from "@/components/maps";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import * as Sortable from "@/components/ui/sortable";
import { DatePicker } from "@/components/trips/date-picker";
import type { DateRange } from "react-day-picker";
import {
  addLocation as apiAddLocation,
  updateLocation as apiUpdateLocation,
  reorderLocations as apiReorderLocations,
} from "@/lib/api/trip-locations";
import { useGooglePlaces } from "@/hooks";
import { toast } from "sonner";

interface RouteMapPageClientProps {
  trip: Trip;
  routeLocations: TripLocation[];
  shareCode: string;
}

export default function RouteMapPageClient({
  trip,
  routeLocations,
  shareCode,
}: RouteMapPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [locations, setLocations] = useState<TripLocation[]>(() => [...routeLocations]);
  const [, setSavingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { results: placeResults, loading: placesLoading, error: placesError, search } = useGooglePlaces();

  const waypoints = tripLocationsToWaypoints(locations);

  const stopNames = locations
    .map((loc) => loc.location_name)
    .filter(Boolean);
  const routeSummary =
    stopNames.length > 1 ? `${stopNames[0]} \u2192 ${stopNames[stopNames.length - 1]}` : stopNames[0] ?? "";

  const handlePlaceSelect = async (placeId: string) => {
    const selected = placeResults.find((place) => place.id === placeId);
    if (!selected) {
      return;
    }

    try {
      const created = await apiAddLocation(trip.id, {
        location_name: selected.name,
        latitude: selected.lat,
        longitude: selected.lng,
        order_index: locations.length + 1,
      });
      setLocations((prev) => [...prev, created]);
    } catch (error) {
      console.error("Failed to add location from place", error);
      toast.error("Failed to add stop from search");
    }
  };
  const handleNameCommit = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const updated = await apiUpdateLocation(trip.id, id, { location_name: trimmed });
      setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, ...updated } : loc)));
    } catch (error) {
      console.error("Failed to update stop name", error);
      toast.error("Failed to update stop name");
    }
  };

  const handleDatesCommit = async (id: string, range: DateRange | undefined) => {
    try {
      const payload: UpdateTripLocation = {};
      if (range?.from) payload.arrival_date = range.from.toISOString();
      if (range?.to) payload.departure_date = range.to.toISOString();
      const updated = await apiUpdateLocation(trip.id, id, payload);
      setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, ...updated } : loc)));
    } catch (error) {
      console.error("Failed to update stop dates", error);
      toast.error("Failed to update stop dates");
    }
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Map background */}
      <MapView waypoints={waypoints} fitToRoute fitPadding={80} className="absolute inset-0" />

      {/* Top overlay header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <button
            onClick={() => router.push(`/trips/${shareCode}`)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors pointer-events-auto shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex flex-col">
            <span className="text-xs uppercase tracking-wide text-white/80 font-medium drop-shadow-md">
              {t("trip_overview.route_map_title")}
            </span>
            <span className="text-sm font-semibold text-white truncate drop-shadow-md">
              {trip.destination || trip.title || t("trips.untitled_trip")}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom sheet via shared Drawer.
          When closed, a small floating pill (DrawerTrigger) stays at bottom center to reopen it. */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className={`fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 bg-black/70 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-2 shadow-lg transition-all ${
              open ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"
            }`}
            aria-label={t("trip_overview.route_title")}
          >
            <MapIcon className="w-3 h-3" />
            <span>{t("trip_overview.route_title")}</span>
          </button>
        </DrawerTrigger>

        <DrawerContent className="border-none bg-black/80 backdrop-blur-2xl max-h-[70vh] max-w-5xl mx-auto mb-4 px-0">
          {/* Header */}
          <div className="px-4 pb-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {t("trip_overview.route_title")}
                </span>
                <span className="text-sm font-semibold text-white">
                  {routeSummary || trip.destination || trip.title || t("trips.untitled_trip")}
                </span>
              </div>
              <div className="text-xs text-white/60">
                {locations.length === 0
                  ? t("trip_overview.route_empty_title")
                  : locations.length === 1
                  ? "1 stop"
                  : `${locations.length} stops`}
              </div>
            </div>

            {/* Google Places search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      search(searchQuery);
                    }
                  }}
                  placeholder={t("trip_overview.route_search_placeholder") ?? "Search places..."}
                  className="w-full rounded-full bg-white/5 border border-white/15 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/35 outline-none focus:border-white/40 focus:ring-0"
                />
              </div>

              {placesError && (
                <p className="mt-2 text-xs text-red-400">
                  {placesError}
                </p>
              )}

              {placesLoading && (
                <p className="mt-2 text-xs text-white/60">
                  {t("trip_overview.route_search_loading") ?? "Searching places…"}
                </p>
              )}

              {!placesLoading && placeResults.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {placeResults.map((place) => (
                    <li key={place.id}>
                      <button
                        type="button"
                        onClick={() => handlePlaceSelect(place.id)}
                        className="w-full text-left rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/15 transition-colors"
                      >
                        <div className="text-xs font-semibold text-white truncate">
                          {place.name}
                        </div>
                        {place.address && (
                          <div className="text-[11px] text-white/55 truncate">
                            {place.address}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Editable, reorderable route list (Phase 2) */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {locations.length === 0 ? (
              <p className="text-sm text-white/60">{t("trip_overview.route_empty")}</p>
            ) : (
              <Sortable.Root
                value={locations}
                onValueChange={(next) => setLocations(next)}
                getItemValue={(item) => item.id}
                orientation="vertical"
                onMove={async ({ activeIndex, overIndex }) => {
                  if (activeIndex === overIndex) return;
                  const newOrder = [...locations];
                  const [moved] = newOrder.splice(activeIndex, 1);
                  newOrder.splice(overIndex, 0, moved);
                  setSavingOrder(true);
                  try {
                    await apiReorderLocations(trip.id, { location_ids: newOrder.map((l) => l.id) });
                    setLocations(newOrder);
                  } catch (error) {
                    console.error("Failed to reorder locations", error);
                    toast.error("Failed to reorder stops");
                  } finally {
                    setSavingOrder(false);
                  }
                }}
              >
                <Sortable.Content className="space-y-3">
                  {locations.map((loc, index) => (
                    <Sortable.Item key={loc.id} value={loc.id} asChild>
                      <RouteLocationRow
                        location={loc}
                        index={index}
                        allLocations={locations}
                        onNameCommit={handleNameCommit}
                        onDatesCommit={handleDatesCommit}
                      />
                    </Sortable.Item>
                  ))}
                </Sortable.Content>
              </Sortable.Root>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

interface RouteLocationRowProps {
  location: TripLocation;
  index: number;
  allLocations: TripLocation[];
  onNameCommit: (id: string, name: string) => void;
  onDatesCommit: (id: string, range: DateRange | undefined) => void;
}

function RouteLocationRow({
  location,
  index,
  allLocations,
  onNameCommit,
  onDatesCommit,
}: RouteLocationRowProps) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftName, setDraftName] = useState(location.location_name || "");

  const selectedRange: DateRange | undefined = location.arrival_date
    ? {
        from: new Date(location.arrival_date),
        to: location.departure_date ? new Date(location.departure_date) : undefined,
      }
    : undefined;

  const formatDateLabel = (range: DateRange | undefined): string => {
    if (!range?.from) return t("date_picker.title");
    const fromStr = range.from.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const toStr = range.to
      ? ` \u2192 ${range.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : "";
    return `${fromStr}${toStr}`;
  };

  const dateLabel = formatDateLabel(selectedRange);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
        <div className="flex flex-col items-center mr-1">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 border border-white/10">
            {index + 1}
          </div>
          {index < allLocations.length - 1 && <div className="flex-1 w-px bg-white/10 mt-1" />}
        </div>

        <div className="flex-1 min-w-0">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => onNameCommit(location.id, draftName)}
            placeholder={t("trips.untitled_trip")}
            className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-white/30 outline-none border-none p-0 focus:ring-0"
          />

          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#ff6b6b] hover:text-[#ff8585] transition-colors"
          >
            <Calendar className="w-3 h-3" />
            <span>{dateLabel}</span>
          </button>
        </div>
      </div>

      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(range) => onDatesCommit(location.id, range)}
        selectedDateRange={selectedRange}
      />
    </>
  );
}


