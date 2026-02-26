"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Map as MapIcon } from "lucide-react";
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
  const [focusLngLat, setFocusLngLat] = useState<{ lng: number; lat: number } | null>(null);

  const waypoints = tripLocationsToWaypoints(locations);

  const stopNames = locations
    .map((loc) => loc.location_name)
    .filter(Boolean);
  const routeSummary =
    stopNames.length > 1 ? `${stopNames[0]} \u2192 ${stopNames[stopNames.length - 1]}` : stopNames[0] ?? "";

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

  const handleFocusOnStop = (loc: TripLocation) => {
    if (loc.latitude != null && loc.longitude != null && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
      setFocusLngLat({ lng: loc.longitude, lat: loc.latitude });
    }
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Map background */}
      <MapView
        waypoints={waypoints}
        fitToRoute
        fitPadding={80}
        className="absolute inset-0"
        focusLngLat={focusLngLat}
      />

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
          {/* Header + Add stop control */}
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">
                  {locations.length === 0
                    ? t("trip_overview.route_empty_title")
                    : locations.length === 1
                    ? "1 stop"
                    : `${locations.length} stops`}
                </span>
              </div>
            </div>
          </div>

          {/* Editable, reorderable route list */}
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
                        onFocusMap={handleFocusOnStop}
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
  onFocusMap?: (location: TripLocation) => void;
}

function RouteLocationRow({
  location,
  index,
  allLocations,
  onNameCommit,
  onDatesCommit,
  onFocusMap,
}: RouteLocationRowProps) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftName, setDraftName] = useState(location.location_name || "");
  const hasCoords =
    location.latitude != null &&
    location.longitude != null &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude);

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
          <button
            type="button"
            onClick={() => onFocusMap?.(location)}
            disabled={!hasCoords || !onFocusMap}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            title={hasCoords ? t("trip_overview.route_focus_map") : undefined}
          >
            {index + 1}
          </button>
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


