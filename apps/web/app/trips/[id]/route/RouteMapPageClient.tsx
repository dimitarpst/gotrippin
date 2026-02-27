"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, Loader2, Map as MapIcon, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CreateTripLocation, Trip, TripLocation, UpdateTripLocation } from "@gotrippin/core";
import { MapView, tripLocationsToWaypoints } from "@/components/maps";
import { useRouteDirections } from "@/hooks";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPlace, setPreviewPlace] = useState<{
    id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [previewDateRange, setPreviewDateRange] = useState<DateRange | undefined>(undefined);
  const [showPreviewDatePicker, setShowPreviewDatePicker] = useState(false);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [focusLngLat, setFocusLngLat] = useState<{ lng: number; lat: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { results: placeResults, loading: placesLoading, error: placesError, search } = useGooglePlaces();

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Debounced search as you type (300ms)
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (!q) return;
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [searchOpen, searchQuery, search]);

  const waypoints = tripLocationsToWaypoints(locations);
  const { routeGeo } = useRouteDirections(waypoints);

  const stopNames = locations
    .map((loc) => loc.location_name)
    .filter(Boolean);
  const routeSummary =
    stopNames.length > 1 ? `${stopNames[0]} \u2192 ${stopNames[stopNames.length - 1]}` : stopNames[0] ?? "";

  const handleConfirmAddPlace = useCallback(
    async () => {
      if (!previewPlace || addingPlaceId) return;
      setAddingPlaceId(previewPlace.id);
      try {
        const payload: Omit<CreateTripLocation, "trip_id"> = {
          location_name: previewPlace.name,
          latitude: previewPlace.lat,
          longitude: previewPlace.lng,
          order_index: locations.length + 1,
        };
        if (previewDateRange?.from) {
          payload.arrival_date = previewDateRange.from.toISOString();
          payload.departure_date = previewDateRange.to
            ? previewDateRange.to.toISOString()
            : previewDateRange.from.toISOString();
        }
        const created = await apiAddLocation(trip.id, payload);
        setLocations((prev) => [...prev, created]);
        toast.success(t("trip_overview.route_stop_added"));
        setPreviewPlace(null);
        setPreviewDateRange(undefined);
        setSearchOpen(false);
        setSearchQuery("");
        setFocusLngLat(null);
      } catch (error) {
        console.error("Failed to add location from place", error);
        toast.error(t("trip_overview.route_add_stop_failed"));
      } finally {
        setAddingPlaceId(null);
      }
    },
    [previewPlace, previewDateRange, addingPlaceId, trip.id, locations.length, t]
  );
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
        routeLineGeo={routeGeo}
        fitToRoute
        fitPadding={80}
        className="absolute inset-0"
        focusLngLat={focusLngLat}
        focusZoom={previewPlace?.id.startsWith("pin:") ? 16 : 14}
        previewLngLat={previewPlace ? { lng: previewPlace.lng, lat: previewPlace.lat } : null}
        onMapClick={({ lng, lat }) => {
          if (searchOpen) return;
          if (addingPlaceId) return;
          const id = `pin:${lng.toFixed(6)},${lat.toFixed(6)}`;
          setPreviewPlace({
            id,
            name: t("trip_overview.route_dropped_pin", { defaultValue: "Dropped pin" }),
            lat,
            lng,
          });
          setPreviewDateRange(undefined);
          setFocusLngLat({ lng, lat });
        }}
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

          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-wide text-white/80 font-medium drop-shadow-md">
              {t("trip_overview.route_map_title")}
            </span>
            <span className="text-sm font-semibold text-white truncate drop-shadow-md">
              {trip.destination || trip.title || t("trips.untitled_trip")}
            </span>
          </div>

          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg"
              aria-label={t("trip_overview.route_search_dialog_title")}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search modal: Add stop */}
      <Dialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) {
            setSearchQuery("");
            setFocusLngLat(null);
            setPreviewDateRange(undefined);
          }
        }}
      >
        <DialogContent
          className="bg-black/90 border border-white/10 rounded-xl text-white gap-4 max-w-[calc(100%-2rem)] sm:max-w-lg p-5 overflow-hidden grid"
          showCloseButton={true}
        >
          <DialogHeader className="min-w-0 pr-8">
            <DialogTitle className="text-white truncate">
              {t("trip_overview.route_search_dialog_title")}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm break-words">
              {t("trip_overview.route_search_hint")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 min-w-0 overflow-hidden">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    search(searchQuery.trim());
                  }
                }}
                placeholder={t("trip_overview.route_search_placeholder") ?? "Search places..."}
                className="w-full min-w-0 rounded-full bg-white/5 border border-white/15 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 focus:ring-0 box-border"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label={t("common.clear", { defaultValue: "Clear" })}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {placesError && <p className="text-xs text-red-400 break-words">{placesError}</p>}
            {placesLoading && (
              <p className="text-xs text-white/60 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span className="min-w-0">{t("trip_overview.route_search_loading") ?? "Searching places…"}</span>
              </p>
            )}
            {!placesLoading && searchQuery.trim() && placeResults.length === 0 && (
              <p className="text-sm text-white/50 py-2 break-words">
                {t("trip_overview.route_search_no_results")}
              </p>
            )}
            {!placesLoading && placeResults.length > 0 && !previewPlace && (
              <ul className="max-h-48 overflow-y-auto overflow-x-hidden space-y-1 min-w-0 -mx-1 px-1" role="listbox">
                {placeResults.map((place) => (
                  <li key={place.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPlace({
                          id: place.id,
                          name: place.name,
                          address: place.address,
                          lat: place.lat,
                          lng: place.lng,
                        });
                        setFocusLngLat({ lng: place.lng, lat: place.lat });
                        setSearchOpen(false);
                      }}
                      className="w-full min-w-0 text-left rounded-lg px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/15 text-xs font-medium text-white flex flex-col gap-0.5 overflow-hidden"
                      role="option"
                    >
                      <span className="block truncate min-w-0">{place.name}</span>
                      {place.address && (
                        <span className="block text-[11px] text-white/55 truncate min-w-0">
                          {place.address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating confirm card: location + timeframe then confirm */}
      {previewPlace && (
        <>
          <div
            className="fixed left-4 right-4 z-30 bottom-24 max-w-lg mx-auto p-3 rounded-xl bg-black/90 border border-white/15 shadow-xl backdrop-blur-md flex flex-col gap-3"
            role="dialog"
            aria-label={t("trip_overview.route_search_confirm_hint")}
          >
            <p className="text-xs text-white/70">
              {t("trip_overview.route_search_confirm_hint")}
            </p>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium text-white truncate text-sm">{previewPlace.name}</span>
              {previewPlace.address && (
                <span className="text-[11px] text-white/55 truncate block">{previewPlace.address}</span>
              )}
            </div>
            {/* When will you be here? (optional but encouraged) */}
            <button
              type="button"
              onClick={() => setShowPreviewDatePicker(true)}
              className="w-full inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 py-2.5 px-3 text-left text-xs font-medium text-white transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0 text-[#ff6b6b]" />
              <span>
                {previewDateRange?.from
                  ? previewDateRange.to
                    ? `${previewDateRange.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} → ${previewDateRange.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                    : previewDateRange.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : t("trip_overview.route_search_when", { defaultValue: "When will you be here?" })}
              </span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewPlace(null);
                  setPreviewDateRange(undefined);
                  setFocusLngLat(null);
                  setSearchOpen(true);
                }}
                className="flex-1 rounded-lg border border-white/20 py-2.5 px-3 text-xs font-medium text-white/90 hover:bg-white/10 transition-colors"
              >
                {t("trip_overview.route_search_choose_another", { defaultValue: "Choose another" })}
              </button>
              <button
                type="button"
                disabled={!!addingPlaceId || !previewDateRange?.from}
                onClick={handleConfirmAddPlace}
                className={`flex-1 rounded-lg border py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:pointer-events-none ${
                  previewDateRange?.from
                    ? "bg-white/20 hover:bg-white/25 border-white/20 text-white"
                    : "bg-white/5 border-white/15 text-white/50"
                }`}
              >
                {addingPlaceId ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("trip_overview.route_search_adding", { defaultValue: "Adding…" })}
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {t("trip_overview.route_search_add_to_route", { defaultValue: "Add to route" })}
                  </>
                )}
              </button>
            </div>
          </div>
          <DatePicker
            open={showPreviewDatePicker}
            onClose={() => setShowPreviewDatePicker(false)}
            onSelect={(range) => {
              setPreviewDateRange(range);
              setShowPreviewDatePicker(false);
            }}
            selectedDateRange={previewDateRange}
          />
        </>
      )}

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
          {/* Header: route title + N stops */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {t("trip_overview.route_title")}
                </span>
                <span className="text-sm font-semibold text-white truncate">
                  {routeSummary || trip.destination || trip.title || t("trips.untitled_trip")}
                </span>
              </div>
              <div className="text-xs text-white/60 shrink-0">
                {locations.length === 0
                  ? t("trip_overview.route_empty_title")
                  : locations.length === 1
                  ? "1 stop"
                  : `${locations.length} stops`}
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


