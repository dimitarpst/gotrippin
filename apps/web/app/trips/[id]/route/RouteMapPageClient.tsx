"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Compass,
  ArrowDownUp,
  HelpCircle,
  Loader2,
  Map as MapIcon,
  Search,
  Star,
  Utensils,
  Bed,
  X,
} from "lucide-react";
import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ColorPicker } from "@/components/color-picker";
import { getLegColor, getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors";
import { useTranslation } from "react-i18next";
import type { CreateTripLocation, Trip, TripLocation, UpdateTripLocation } from "@gotrippin/core";
import { MapView, tripLocationsToWaypoints } from "@/components/maps";
import { useAlongRoutePlaces, useRouteDirections } from "@/hooks";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  Tour,
  TourPortal,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourArrow,
  TourClose,
  TourHeader,
  TourTitle,
  TourDescription,
  TourFooter,
  TourStepCounter,
  TourPrev,
  TourNext,
} from "@/components/ui/tour";
import AuroraBackground from "@/components/effects/aurora-background";
import { cn } from "@/lib/utils";

interface RouteMapPageClientProps {
  trip: Trip;
  routeLocations: TripLocation[];
  shareCode: string;
  isWizard?: boolean;
}

/** Pending stop before "Add to route" (search, map tap, or along-route). */
interface RoutePreviewPlace {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  markerColor: string;
}

export default function RouteMapPageClient({
  trip,
  routeLocations,
  shareCode,
  isWizard = false,
}: RouteMapPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [open, setOpen] = useState(true);
  const [locations, setLocations] = useState<TripLocation[]>(() => [...routeLocations]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [routeReorderMode, setRouteReorderMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPlace, setPreviewPlace] = useState<RoutePreviewPlace | null>(null);
  const [previewDateRange, setPreviewDateRange] = useState<DateRange | undefined>(undefined);
  const [showPreviewDatePicker, setShowPreviewDatePicker] = useState(false);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<"map" | "search" | "along" | null>(null);
  const [focusLngLat, setFocusLngLat] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showAlongPanel, setShowAlongPanel] = useState(false);
  const [alongCategory, setAlongCategory] = useState<"food" | "sights" | "stays" | "other" | "all">("food");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const routeReorderSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { results: placeResults, loading: placesLoading, error: placesError, search } = useGooglePlaces();
  const [routeTourOpen, setRouteTourOpen] = useState(false);
  const [routeTourStep, setRouteTourStep] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const hasMarkedRouteTourRef = useRef(false);
  const hasAutoOpenedRouteTourRef = useRef(false);
  const hasAutoOpenedSearchRef = useRef(false);
  const hasShownAllSetRef = useRef(false);
  const tourPendingStep3Ref = useRef(false);
  const tourPendingStep4Ref = useRef(false);
  const tourJustAdvancedToStep3Ref = useRef(false);
  const tourClosingForPrevRef = useRef(false);

  // When drawer opens for tour step 3, advance only after open animation completes (event-driven).
  const handleDrawerOpenComplete = useCallback(() => {
    if (!tourPendingStep3Ref.current) return;
    tourPendingStep3Ref.current = false;
    tourJustAdvancedToStep3Ref.current = true;
    setRouteTourStep(2);
  }, []);

  // When drawer closes after Next on step 3: do NOT clear tourPendingStep4Ref here.
  // Clearing it would allow the tour to close (interact-outside when drawer unmounts).
  // We advance in handleDrawerOpenChange; this callback is only for Vaul's unreliable onAnimationEnd.
  const handleDrawerCloseComplete = useCallback(() => {
    if (!tourPendingStep4Ref.current) return;
    // Intentionally do nothing - keep tourPendingStep4Ref true so tour stays open
  }, []);

  // After we've advanced to step 3, focus the Next button once the step popover is in the DOM (frame-based, no static ms).
  useEffect(() => {
    if (routeTourStep !== 2 || !tourJustAdvancedToStep3Ref.current) return;
    tourJustAdvancedToStep3Ref.current = false;
    const focusTourNext = () => {
      const el = document.getElementById('route-tour-next') ?? document.querySelector('[data-slot="tour-next"]');
      if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    };
    let rafId: number;
    const schedule = () => {
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          focusTourNext();
        });
      });
    };
    schedule();
    return () => cancelAnimationFrame(rafId);
  }, [routeTourStep]);

  // "You're all set" when landing on route page after creating trip (wizard + 1 stop).
  useEffect(() => {
    if (!isWizard || locations.length !== 1 || hasShownAllSetRef.current) return;
    hasShownAllSetRef.current = true;
    toast.success(t("trips.youre_all_set_title", { defaultValue: "You're all set!" }), {
      description: t("trips.youre_all_set_description", {
        defaultValue: "Add more stops or tap the itinerary below.",
      }),
    });
  }, [isWizard, locations.length, t]);

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

  // Wizard with 0 stops: auto-open search and prefill; zoom map in a bit.
  useEffect(() => {
    if (!isWizard || locations.length > 0) return;
    if (hasAutoOpenedSearchRef.current) return;
    hasAutoOpenedSearchRef.current = true;
    setSearchOpen(true);
    const prefill = trip.destination || trip.title || "";
    setSearchQuery(prefill);
  }, [isWizard, locations.length, trip.destination, trip.title]);

  // Route editor tour (wizard mode only), stored in Supabase user_metadata.ui_tours.route_editor_v1.
  // Only starts after the user has added at least one stop. Open only once per session to avoid freeze.
  useEffect(() => {
    if (!isWizard) return;
    if (!user) return;
    if (locations.length === 0) return;
    if (hasAutoOpenedRouteTourRef.current) return;

    const uiTours =
      (user.user_metadata?.ui_tours as Record<string, unknown> | undefined) ?? {};
    const hasSeenRouteTour = uiTours["route_editor_v1"] === true;

    if (!hasSeenRouteTour) {
      hasAutoOpenedRouteTourRef.current = true;
      setRouteTourOpen(true);
    }
  }, [isWizard, user, locations.length]);

  const markRouteTourSeen = async () => {
    if (!user) return;
    if (hasMarkedRouteTourRef.current) return;
    hasMarkedRouteTourRef.current = true;

    try {
      const existing =
        ((user.user_metadata?.ui_tours as Record<string, boolean> | undefined) ??
          {});

      const { error } = await supabase.auth.updateUser({
        data: {
          ui_tours: {
            ...existing,
            route_editor_v1: true,
          },
        },
      });

      if (error) {
        console.error("Failed to persist route editor tour flag:", error);
        return;
      }

      void refreshProfile();
    } catch (error) {
      console.error("Unexpected error while persisting route editor tour flag:", error);
    }
  };

  const handleRouteTourOpenChange = (openTour: boolean) => {
    if (!openTour && (tourPendingStep3Ref.current || tourPendingStep4Ref.current)) {
      return;
    }
    setRouteTourOpen(openTour);
    if (!openTour) {
      setRouteTourStep(0);
      void markRouteTourSeen();
    }
  };

  const waypoints = tripLocationsToWaypoints(locations);
  const { routeGeo } = useRouteDirections(waypoints);
  const tripMinDate = trip.start_date ? new Date(trip.start_date) : undefined;
  const tripMaxDate = trip.end_date ? new Date(trip.end_date) : undefined;
  const alongRoute = useAlongRoutePlaces(waypoints);
  const filteredAlongPlaces =
    alongRoute.places.filter((p) => alongCategory === "all" || p.category === alongCategory);

  const stopNames = locations
    .map((loc) => loc.location_name)
    .filter(Boolean);
  const routeSummary =
    stopNames.length > 1 ? `${stopNames[0]} \u2192 ${stopNames[stopNames.length - 1]}` : stopNames[0] ?? "";
  const canExitWizard = locations.length >= 2;

  const handleShowRouteTourAgain = () => {
    if (!isWizard) return;
    setRouteTourStep(0);
    setRouteTourOpen(true);
  };

  const handleTourNext = () => {
    if (routeTourStep === 1) {
      tourPendingStep3Ref.current = true;
      setOpen(true);
    } else if (routeTourStep === 2) {
      tourPendingStep4Ref.current = true;
      setOpen(false);
      // Step 4 advances in handleDrawerCloseComplete when drawer close animation completes
    } else if (routeTourStep === 4) {
      tourPendingStep4Ref.current = false;
      setOpen(false);
      setRouteTourStep(5);
    } else {
      setRouteTourStep(routeTourStep + 1);
    }
  };

  const handleTourPrev = () => {
    if (routeTourStep === 4) {
      tourPendingStep4Ref.current = false;
      setRouteTourStep(3);
    } else if (routeTourStep === 3) {
      tourPendingStep4Ref.current = false;
      tourPendingStep3Ref.current = true;
      setOpen(true);
      // Step 3 shows in handleDrawerOpenComplete when drawer open animation completes
    } else if (routeTourStep === 2) {
      tourClosingForPrevRef.current = true;
      setRouteTourStep(1);
      setOpen(false);
    } else {
      setRouteTourStep(routeTourStep - 1);
    }
  };

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    // Only block drawer close on steps 4–5. On step 3, allow close so first Next click works (Vaul fires onOpenChange before our click).
    const willBlock = !nextOpen && routeTourOpen && routeTourStep >= 3;
    if (willBlock) return;
    setOpen(nextOpen);
    // When closing from step 3 (user clicked Next), advance to step 4. Do NOT advance when closing for Previous (step 3→2).
    if (!nextOpen && routeTourOpen && routeTourStep === 2 && !tourClosingForPrevRef.current) {
      tourPendingStep4Ref.current = true;
      setRouteTourStep(3);
    }
    tourClosingForPrevRef.current = false;
  };

  const handleConfirmAddPlace = useCallback(
    async () => {
      if (!previewPlace || addingPlaceId) return;
      setAddingPlaceId(previewPlace.id);
      try {
        const payload: Omit<CreateTripLocation, "trip_id"> = {
          location_name: previewPlace.name.trim() || t("trip_overview.route_dropped_pin"),
          latitude: previewPlace.lat,
          longitude: previewPlace.lng,
          order_index: locations.length + 1,
          marker_color: previewPlace.markerColor,
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
        setPreviewSource(null);
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

  const handleMarkerColorCommit = async (id: string, hex: string) => {
    if (!isSolidRouteColor(hex)) return;
    try {
      const updated = await apiUpdateLocation(trip.id, id, { marker_color: hex });
      setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, ...updated } : loc)));
    } catch (error) {
      console.error("Failed to update marker color", error);
      toast.error(t("trip_overview.route_marker_color_failed", { defaultValue: "Could not update marker color" }));
    }
  };

  const handleFocusOnStop = (loc: TripLocation) => {
    setSelectedLocationId(loc.id);
    if (loc.latitude != null && loc.longitude != null && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
      setFocusLngLat({ lng: loc.longitude, lat: loc.latitude });
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) setRouteReorderMode(false);
  }, [open]);

  return (
    <div className="h-screen w-full bg-[var(--color-background)] flex flex-col overflow-hidden relative">
      {isWizard && <AuroraBackground className="absolute inset-0 pointer-events-none z-0" />}
      {/* Wizard: step bar is transparent so aurora shows through (like create-trip step 2). Gradient bar overlays map only. */}
      {isWizard && (
        <div
          className="shrink-0 relative z-10 px-6 py-3 flex items-center justify-between"
          role="region"
          aria-label={t("trips.walkthrough", { defaultValue: "Walkthrough" })}
        >
          <button
            onClick={() => {
              if (!canExitWizard) return;
              router.push(`/trips/${shareCode}`);
            }}
            disabled={!canExitWizard}
            className="px-4 py-2 rounded-full text-[#ff7670] text-lg font-medium border border-white/20 disabled:opacity-50 hover:bg-white/5 transition-colors disabled:border-white/10"
          >
            {t("common.back", { defaultValue: "Back" })}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
            <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
            <span className="w-2 h-2 rounded-full bg-white shrink-0" />
          </span>
          <button
            type="button"
            onClick={() => setShowCongrats(true)}
            className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors flex items-center justify-center"
          >
            {t("common.next", { defaultValue: "Next" })}
          </button>
        </div>
      )}
      {/* Map area: in wizard, map controls bar is overlaid on map so gradient fades over map. */}
      <div className="flex-1 relative min-h-0">
        {isWizard && (
          <div
            className="absolute top-0 left-0 right-0 z-10 px-6 py-3 flex items-center justify-between gap-4 w-full"
            style={{
              background: "linear-gradient(to bottom, var(--color-background) 0%, transparent 100%)",
            }}
            role="region"
            aria-label={t("trip_overview.route_map_title")}
          >
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-xs uppercase tracking-wide text-white/80 font-medium">
                {t("trip_overview.route_map_title")}
              </span>
              <span className="text-sm font-semibold text-white truncate">
                {trip.destination || trip.title || t("trips.untitled_trip")}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Always visible in wizard so the tour can target it; disabled until 2+ stops */}
              <button
                type="button"
                id="route-along-button"
                onClick={() => alongRoute.places.length > 0 && setShowAlongPanel((prev) => !prev)}
                disabled={locations.length < 2}
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:opacity-40 disabled:hover:bg-black/40"
                aria-label={t("trip_overview.route_along_label", { defaultValue: "Along this route" })}
              >
                <Compass className="w-5 h-5" />
              </button>
              <button
                type="button"
                id="route-guide-button"
                onClick={handleShowRouteTourAgain}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors"
                aria-label={t("trip_overview.show_route_tips_again", { defaultValue: "Show guide again" })}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                id="route-search-button"
                onClick={() => setSearchOpen(true)}
                disabled={routeTourOpen}
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors disabled:opacity-40 disabled:hover:bg-black/40"
                aria-label={t("trip_overview.route_search_dialog_title")}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <MapView
          waypoints={waypoints}
          routeLineGeo={routeGeo}
          fitToRoute
          fitPadding={80}
          className="absolute inset-0"
          focusLngLat={focusLngLat}
          focusZoom={previewPlace?.id.startsWith("pin:") ? 16 : 14}
          previewLngLat={previewPlace ? { lng: previewPlace.lng, lat: previewPlace.lat } : null}
          previewMarkerColor={previewPlace?.markerColor ?? null}
          defaultCenter={isWizard && locations.length === 0 ? { lng: 23.32, lat: 42.7 } : undefined}
          defaultZoom={isWizard && locations.length === 0 ? 10 : undefined}
          selectedWaypointId={selectedLocationId}
          onWaypointClick={({ id }) => {
            const loc = locations.find((l) => l.id === id);
            if (loc) handleFocusOnStop(loc);
          }}
          onMapClick={({ lng, lat }) => {
            if (searchOpen) return;
            if (addingPlaceId) return;
            setSelectedLocationId(null);
            setOpen(false);
            const id = `pin:${lng.toFixed(6)},${lat.toFixed(6)}`;
            setPreviewPlace({
              id,
              name: t("trip_overview.route_dropped_pin", { defaultValue: "Dropped pin" }),
              lat,
              lng,
              markerColor: getLegColor(locations.length),
            });
            setPreviewDateRange(undefined);
            setPreviewSource("map");
            setFocusLngLat({ lng, lat });
          }}
        />

        {/* Non-wizard: overlay with back + title + search */}
        {!isWizard && (
          <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
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
              <div className="pointer-events-auto flex items-center gap-2">
                {alongRoute.places.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAlongPanel((prev) => !prev)}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg"
                    aria-label={t("trip_overview.route_along_label", { defaultValue: "Along this route" })}
                  >
                    <Compass className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  id="route-search-button"
                  onClick={() => setSearchOpen(true)}
                  disabled={routeTourOpen}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-lg disabled:opacity-40 disabled:hover:bg-black/40"
                  aria-label={t("trip_overview.route_search_dialog_title")}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Congrats overlay (wizard final screen) — same look as create-trip: aurora + content */}
      {isWizard && showCongrats && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--color-background)] px-6 overflow-hidden">
          <AuroraBackground className="absolute inset-0 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-2xl font-semibold text-white mb-2">
              {t("trips.congrats_title", { defaultValue: "You're all set!" })}
            </p>
            <p className="text-white/70 text-center mb-8 max-w-sm">
              {t("trips.congrats_description", { defaultValue: "You've created your trip. Add more stops anytime from the map or view your itinerary." })}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/trips/${shareCode}`)}
              className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
            >
              {t("trips.view_trip", { defaultValue: "View trip" })}
            </button>
          </div>
        </div>
      )}

      {/* Search modal: Add stop */}
      <Dialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) {
            setSearchQuery("");
            setFocusLngLat(null);
            setPreviewDateRange(undefined);
            setPreviewSource(null);
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
              <ul className="max-h-48 overflow-y-auto overflow-x-hidden space-y-1 min-w-0 -mx-1 px-1">
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
                          markerColor: getLegColor(locations.length),
                        });
                        setPreviewSource("search");
                        setFocusLngLat({ lng: place.lng, lat: place.lat });
                        setSearchOpen(false);
                      }}
                      className="w-full min-w-0 text-left rounded-lg px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/15 text-xs font-medium text-white flex flex-col gap-0.5 overflow-hidden"
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

      {/* Bottom overlay stack: confirm card + along-route panel */}
      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 space-y-3 pointer-events-none">
        {/* Floating confirm card: location + timeframe then confirm */}
        <AnimatePresence>
          {previewPlace && (
            <>
              <motion.div
                key="route-confirm-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="max-w-lg mx-auto p-3 rounded-xl bg-black/90 border border-white/15 shadow-xl backdrop-blur-md flex flex-col gap-3 pointer-events-auto"
                role="dialog"
                aria-label={t("trip_overview.route_search_confirm_hint")}
              >
                <p className="text-xs text-white/70">
                  {t("trip_overview.route_search_confirm_hint")}
                </p>
                {previewPlace.address ? (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] text-white/55 truncate block">{previewPlace.address}</span>
                  </div>
                ) : null}
                <div
                  className="flex min-h-10 items-center gap-2 min-w-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={previewPlace.name}
                    onChange={(e) =>
                      setPreviewPlace((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                    }
                    autoComplete="off"
                    aria-label={t("trip_overview.route_stop_name_input", { defaultValue: "Stop name" })}
                    placeholder={t("trip_overview.route_enter_location_name", {
                      defaultValue: "Location name",
                    })}
                    className="min-h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-white placeholder:text-white/35 outline-none focus:ring-0 focus-visible:outline-none"
                  />
                  <div className="flex shrink-0 items-center self-stretch">
                    <ColorPicker
                      value={previewPlace.markerColor}
                      onChange={(hex) =>
                        setPreviewPlace((prev) => (prev ? { ...prev, markerColor: hex } : prev))
                      }
                      triggerAriaLabel={t("trip_overview.route_marker_color", {
                        defaultValue: "Marker color",
                      })}
                      className="border border-white/20"
                    />
                  </div>
                </div>
                {/* When will you be here? (optional but encouraged) */}
                <button
                  type="button"
                  onClick={() => setShowPreviewDatePicker(true)}
                  className="w-full inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
                  aria-label={t("trip_overview.route_search_when", { defaultValue: "When will you be here?" })}
                >
                  <Calendar className="h-4 w-4 shrink-0 text-white/90" strokeWidth={2} aria-hidden />
                  <span className="min-w-0 truncate">
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
                      setPreviewSource(null);
                      setSearchOpen(true);
                    }}
                    className="flex-1 rounded-lg border border-white/20 py-2.5 px-3 text-xs font-medium text-white/90 hover:bg-white/10 transition-colors"
                  >
                    {t("trip_overview.route_search_choose_another", { defaultValue: "Choose another" })}
                  </button>
                  <button
                    type="button"
                    disabled={!!addingPlaceId}
                    onClick={() => {
                      if (!previewDateRange?.from) {
                        // Act as cancel when no date selected
                        setPreviewPlace(null);
                        setPreviewDateRange(undefined);
                        setFocusLngLat(null);
                        if (previewSource === "along") {
                          setShowAlongPanel(true);
                        }
                        setPreviewSource(null);
                        return;
                      }
                      void handleConfirmAddPlace();
                    }}
                    className={`flex-1 rounded-lg border py-2.5 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:pointer-events-none ${
                      previewDateRange?.from
                        ? "bg-white/20 hover:bg-white/25 border-white/20 text-white"
                        : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {addingPlaceId ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("trip_overview.route_search_adding", { defaultValue: "Adding…" })}
                      </>
                    ) : previewDateRange?.from ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {t("trip_overview.route_search_add_to_route", { defaultValue: "Add to route" })}
                      </>
                    ) : (
                      <span>{t("common.cancel", { defaultValue: "Cancel" })}</span>
                    )}
                  </button>
                </div>
              </motion.div>
              <DatePicker
                open={showPreviewDatePicker}
                onClose={() => setShowPreviewDatePicker(false)}
                onSelect={(range) => {
                  setPreviewDateRange(range);
                  setShowPreviewDatePicker(false);
                }}
                selectedDateRange={previewDateRange}
                minDate={tripMinDate}
                maxDate={tripMaxDate}
              />
            </>
          )}
        </AnimatePresence>

      {/* Bottom sheet via shared Drawer.
          When closed, a small floating pill (DrawerTrigger) stays at bottom center to reopen it.
          During the tour we hide the pill only on step 1 (search) so steps 2–3 can target it / the drawer. */}
      <Drawer
            open={open}
            onOpenChange={handleDrawerOpenChange}
            onOpenComplete={handleDrawerOpenComplete}
            onCloseComplete={handleDrawerCloseComplete}
            modal={false}
            handleOnly
            dismissible
          >
        <DrawerTrigger asChild>
          <button
            type="button"
            id="route-itinerary-trigger"
            onClick={() => setOpen(true)}
            className={`fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 bg-black/70 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-2 shadow-lg transition-all pointer-events-auto ${
              open || previewPlace || showAlongPanel || (routeTourOpen && routeTourStep === 0)
                ? "opacity-0 pointer-events-none translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
            aria-label={t("trip_overview.route_title")}
          >
            <MapIcon className="w-3 h-3" />
            <span>{t("trip_overview.route_title")}</span>
          </button>
        </DrawerTrigger>

        <DrawerContent
          id="route-drawer-root"
          className={cn(
            "border-none bg-black/90 backdrop-blur-2xl max-w-5xl mx-auto px-0",
            "!mt-0 mb-0 !z-[200]",
            /* Snap points + map WebGL broke transforms and left an invisible full-screen blocker; use a normal sheet. */
            routeReorderMode
              ? "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-0.5rem))]"
              : "max-h-[min(72dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-1rem))]",
            "flex min-h-0 flex-col overflow-hidden shadow-2xl ring-1 ring-white/10",
          )}
        >
          <div id="route-drawer-content" className="flex flex-1 flex-col min-h-0">
          {/* Header: route title + N stops */}
          <div className="px-4 pb-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {t("trip_overview.route_title")}
                </span>
                <span className="text-sm font-semibold text-white truncate">
                  {routeSummary || trip.destination || trip.title || t("trips.untitled_trip")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {locations.length >= 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRouteReorderMode((v) => !v);
                    }}
                    aria-pressed={routeReorderMode}
                    aria-label={
                      routeReorderMode
                        ? t("trip_overview.route_reorder_done", { defaultValue: "Done reordering" })
                        : t("trip_overview.route_reorder_start", { defaultValue: "Reorder stops" })
                    }
                    className={`flex h-9 max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-white/90 transition-colors sm:max-w-none ${
                      routeReorderMode
                        ? "border-[#ff7670] bg-[#ff7670]/20 text-white"
                        : "border-white/15 bg-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <ArrowDownUp className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="text-[11px] font-semibold leading-tight">
                      {routeReorderMode
                        ? t("trip_overview.route_reorder_done_short", { defaultValue: "Done" })
                        : t("trip_overview.route_reorder_action", { defaultValue: "Reorder" })}
                    </span>
                  </button>
                ) : null}
                <div className="text-xs text-white/60 tabular-nums">
                  {locations.length === 0
                    ? t("trip_overview.route_empty_title")
                    : locations.length === 1
                      ? t("trip_overview.route_one_stop", { defaultValue: "1 stop" })
                      : t("trip_overview.route_stops_count", { count: locations.length })}
                </div>
              </div>
            </div>
            {routeReorderMode && locations.length >= 2 ? (
              <p className="mt-2 text-[11px] text-white/50">
                {t("trip_overview.route_reorder_hint", {
                  defaultValue: "Drag a card by its edges to change the order of stops.",
                })}
              </p>
            ) : null}
          </div>

          {/* Route list: Vaul sets touch-action:none on the drawer root; pan-y helps touch scroll inside. */}
          <div
            className="flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 min-h-0 [touch-action:pan-y]"
            data-vaul-no-drag=""
          >
            {locations.length === 0 ? (
              <p className="text-sm text-white/60">{t("trip_overview.route_empty")}</p>
            ) : routeReorderMode ? (
              <Sortable.Root
                sensors={routeReorderSensors}
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
                    toast.error(t("trip_overview.route_reorder_failed", { defaultValue: "Failed to reorder stops" }));
                  } finally {
                    setSavingOrder(false);
                  }
                }}
              >
                <Sortable.Content className="space-y-3">
                  {locations.map((loc, index) => (
                    <Sortable.Item
                      key={loc.id}
                      value={loc.id}
                      disabled={savingOrder}
                      className="relative rounded-2xl outline-none data-dragging:z-[1] data-dragging:shadow-xl"
                    >
                      <div className="relative z-0">
                        <RouteLocationRow
                          location={loc}
                          index={index}
                          allLocations={locations}
                          reorderMode
                          onNameCommit={handleNameCommit}
                          onDatesCommit={handleDatesCommit}
                          onMarkerColorCommit={handleMarkerColorCommit}
                          onFocusMap={handleFocusOnStop}
                          minDate={tripMinDate}
                          maxDate={tripMaxDate}
                        />
                      </div>
                      <Sortable.ItemHandle
                        className="absolute inset-0 z-[1] cursor-grab touch-none rounded-2xl border-0 bg-transparent p-0 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:cursor-grabbing"
                        aria-label={t("trip_overview.route_drag_row", {
                          name: loc.location_name?.trim() || t("trips.untitled_trip"),
                        })}
                      />
                    </Sortable.Item>
                  ))}
                </Sortable.Content>
              </Sortable.Root>
            ) : (
              <div className="space-y-3">
                {locations.map((loc, index) => (
                  <RouteLocationRow
                    key={loc.id}
                    location={loc}
                    index={index}
                    allLocations={locations}
                    onNameCommit={handleNameCommit}
                    onDatesCommit={handleDatesCommit}
                    onMarkerColorCommit={handleMarkerColorCommit}
                    onFocusMap={handleFocusOnStop}
                    minDate={tripMinDate}
                    maxDate={tripMaxDate}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        </DrawerContent>
      </Drawer>

        {/* Along-route mini panel (separate from itinerary drawer) */}
        <AnimatePresence>
          {showAlongPanel && (
            <motion.div
              key="along-route-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mx-auto max-w-5xl rounded-2xl bg-black/85 border border-white/15 backdrop-blur-xl p-3 space-y-3 shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Compass className="w-4 h-4 text-white/80" />
                  <span className="text-xs uppercase tracking-wide text-white/70 truncate">
                    {t("trip_overview.route_along_label", { defaultValue: "Along this route" })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlongPanel(false)}
                  className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                  aria-label={t("common.close", { defaultValue: "Close" })}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex gap-2 text-[11px] text-white/75">
                {[
                  { id: "food" as const, icon: Utensils, label: t("trip_overview.route_along_food", { defaultValue: "Food" }) },
                  { id: "sights" as const, icon: Star, label: t("trip_overview.route_along_sights", { defaultValue: "Sights" }) },
                  { id: "stays" as const, icon: Bed, label: t("trip_overview.route_along_stays", { defaultValue: "Stays" }) },
                  { id: "all" as const, icon: MapIcon, label: t("trip_overview.route_along_all", { defaultValue: "All" }) },
                ].map((chip) => {
                  const Icon = chip.icon;
                  const active = alongCategory === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setAlongCategory(chip.id)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 border text-[11px] ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              {alongRoute.loading && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("common.loading", { defaultValue: "Loading…" })}</span>
                </div>
              )}
              {!alongRoute.loading && filteredAlongPlaces.length === 0 && (
                <p className="text-xs text-white/60">
                  {t("trip_overview.route_along_empty", {
                    defaultValue: "No suggestions yet for this part of the route.",
                  })}
                </p>
              )}

              {!alongRoute.loading && filteredAlongPlaces.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {filteredAlongPlaces.slice(0, 8).map((place) => {
                    const Icon =
                      place.category === "food"
                        ? Utensils
                        : place.category === "stays"
                        ? Bed
                        : place.category === "sights"
                        ? Star
                        : MapIcon;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => {
                          setPreviewPlace({
                            id: place.id,
                            name: place.name,
                            address: place.address,
                            lat: place.lat,
                            lng: place.lng,
                            markerColor: getLegColor(locations.length),
                          });
                          setPreviewDateRange(undefined);
                          setPreviewSource("along");
                          setFocusLngLat({ lng: place.lng, lat: place.lat });
                          setShowAlongPanel(false);
                        }}
                        className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 px-2 py-3 text-[10px] text-white/80"
                      >
                        <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate w-full text-center line-clamp-2">{place.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isWizard && (
        <Tour
          open={routeTourOpen}
          onOpenChange={handleRouteTourOpenChange}
          value={routeTourStep}
          onValueChange={setRouteTourStep}
          alignOffset={0}
          sideOffset={16}
          spotlightPadding={8}
          pointerDownOutsideIgnoreSelectors={["[data-drawer-overlay]", "#route-drawer-root"]}
          onInteractOutside={(e) => {
            if (routeTourStep === 3 && tourPendingStep4Ref.current) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (routeTourStep === 3 && tourPendingStep4Ref.current) e.preventDefault();
          }}
          stepFooter={
            <TourFooter>
              <div className="flex w-full items-center justify-between">
                <TourStepCounter className="text-xs text-muted-foreground" />
                <div className="flex gap-2">
                  {routeTourStep === 2 || routeTourStep === 3 || routeTourStep === 4 ? (
                    <button
                      type="button"
                      className="h-8 px-3 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium inline-flex items-center justify-center"
                      onPointerDownCapture={() => {
                        if (routeTourStep === 2) tourClosingForPrevRef.current = true;
                      }}
                      onClick={handleTourPrev}
                    >
                      {t("common.previous", { defaultValue: "Previous" })}
                    </button>
                  ) : (
                    <TourPrev
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    />
                  )}
                  {routeTourStep === 1 || routeTourStep === 2 || routeTourStep === 3 || routeTourStep === 4 ? (
                    <button
                      type="button"
                      id="route-tour-next"
                      className="h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium inline-flex items-center justify-center"
                      onClick={handleTourNext}
                    >
                      {t("common.next", { defaultValue: "Next" })}
                    </button>
                  ) : (
                    <TourNext
                      size="sm"
                      className="h-8 px-4 text-xs"
                    />
                  )}
                </div>
              </div>
            </TourFooter>
          }
        >
          <TourPortal>
            <TourSpotlight />
            <TourSpotlightRing className="rounded-2xl border-2 border-primary shadow-[0_0_30px_rgba(255, 118, 112,0.45)]" />

            <TourStep target="#route-search-button" side="bottom">
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trip_overview.route_search_title", { defaultValue: "Add your first stop" })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_search_hint", {
                    defaultValue: "Search for a place, then confirm on the map.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#route-itinerary-trigger" side="top">
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trip_overview.route_tour_itinerary_pill_title", { defaultValue: "Your itinerary" })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_tour_itinerary_pill", {
                    defaultValue: "Tap here to open your list. Reorder stops and edit dates.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#route-drawer-root" side="top" forceMount>
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trip_overview.route_title", { defaultValue: "Your route" })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_tour_itinerary", {
                    defaultValue: "Stops appear here. Drag to reorder, tap to edit dates.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#route-along-button" side="bottom" forceMount>
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trip_overview.route_tour_along_title", { defaultValue: "Places along your route" })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_tour_along", {
                    defaultValue: "Once you have 2+ stops, tap the compass to find food, sights, and stays along the way.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>

            <TourStep target="#route-guide-button" side="bottom" forceMount>
              <TourArrow />
              <TourClose />
              <TourHeader className="items-start text-left sm:text-left">
                <TourTitle>
                  {t("trip_overview.route_tour_guide_title", { defaultValue: "Reopen this guide" })}
                </TourTitle>
                <TourDescription>
                  {t("trip_overview.route_tour_find_guide", {
                    defaultValue: "Tap the ? button anytime to see these steps again.",
                  })}
                </TourDescription>
              </TourHeader>
            </TourStep>
          </TourPortal>
        </Tour>
      )}
    </div>
  );
}

interface RouteLocationRowProps {
  location: TripLocation;
  index: number;
  allLocations: TripLocation[];
  /** When true, row is styled for drag-reorder (dashed card); row body does not focus the map on click. */
  reorderMode?: boolean;
  onNameCommit: (id: string, name: string) => void;
  onDatesCommit: (id: string, range: DateRange | undefined) => void;
  onMarkerColorCommit: (id: string, hex: string) => void;
  onFocusMap?: (location: TripLocation) => void;
  minDate?: Date;
  maxDate?: Date;
}

function RouteLocationRow({
  location,
  index,
  allLocations,
  reorderMode = false,
  onNameCommit,
  onDatesCommit,
  onMarkerColorCommit,
  onFocusMap,
  minDate,
  maxDate,
}: RouteLocationRowProps) {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftName, setDraftName] = useState(location.location_name || "");

  useEffect(() => {
    setDraftName(location.location_name || "");
  }, [location.id, location.location_name]);

  useEffect(() => {
    if (reorderMode) {
      setShowDatePicker(false);
    }
  }, [reorderMode]);

  const hasCoords =
    location.latitude != null &&
    location.longitude != null &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude);

  const markerPickerValue =
    location.marker_color != null && isSolidRouteColor(location.marker_color)
      ? location.marker_color
      : getStablePaletteColorForLocationId(location.id);

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

  const handleRowClick = () => {
    if (reorderMode) return;
    if (hasCoords && onFocusMap) onFocusMap(location);
  };

  const rowFocusable = !reorderMode && hasCoords && onFocusMap;

  return (
    <>
      <div
        role={rowFocusable ? "button" : undefined}
        tabIndex={rowFocusable ? 0 : undefined}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (reorderMode) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick();
          }
        }}
        className={
          reorderMode
            ? "flex select-none items-center gap-3 rounded-2xl border border-dashed border-white/35 bg-white/[0.04] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors"
            : "flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition-colors hover:bg-white/[0.07]"
        }
      >
        <div
          className="mr-1 flex shrink-0 flex-col items-center"
          onClick={reorderMode ? undefined : (e) => e.stopPropagation()}
        >
          {reorderMode ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-[11px] font-semibold text-white shadow-md"
              style={{ backgroundColor: markerPickerValue }}
              aria-hidden
            >
              {index + 1}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFocusMap?.(location);
              }}
              disabled={!hasCoords || !onFocusMap}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-[11px] font-semibold text-white shadow-md transition-colors disabled:pointer-events-none disabled:opacity-50"
              style={{ backgroundColor: markerPickerValue }}
              title={hasCoords ? t("trip_overview.route_focus_map") : undefined}
            >
              {index + 1}
            </button>
          )}
          {!reorderMode && index < allLocations.length - 1 ? (
            <div className="mt-1 flex-1 bg-white/10 w-px" />
          ) : null}
        </div>

        <div
          className="min-w-0 flex-1"
          onClick={reorderMode ? undefined : (e) => e.stopPropagation()}
        >
          {reorderMode ? (
            <div className="flex min-h-10 flex-col gap-2">
              <p className="line-clamp-2 text-sm font-semibold text-white">
                {draftName.trim() || t("trips.untitled_trip")}
              </p>
              <div className="inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 sm:w-auto">
                <Calendar className="h-4 w-4 shrink-0 text-white/60" strokeWidth={2} aria-hidden />
                <span>{dateLabel}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-h-10 items-center gap-2">
                <div className="flex min-h-10 min-w-0 flex-1 items-center">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => onNameCommit(location.id, draftName)}
                    placeholder={t("trips.untitled_trip")}
                    className="h-10 w-full border-0 bg-transparent p-0 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:ring-0 focus-visible:outline-none"
                  />
                </div>
                <div
                  className="flex shrink-0 items-center self-stretch"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ColorPicker
                    value={markerPickerValue}
                    onChange={(hex) => onMarkerColorCommit(location.id, hex)}
                    triggerAriaLabel={t("trip_overview.route_marker_color", {
                      defaultValue: "Marker color",
                    })}
                    className="border border-white/20"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDatePicker(true);
                }}
                className="mt-2 inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/15 sm:w-auto"
                aria-label={`${t("date_picker.title")}: ${dateLabel}`}
              >
                <Calendar className="h-4 w-4 shrink-0 text-white/90" strokeWidth={2} aria-hidden />
                <span>{dateLabel}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <DatePicker
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(range) => onDatesCommit(location.id, range)}
        selectedDateRange={selectedRange}
        minDate={minDate}
        maxDate={maxDate}
      />
    </>
  );
}


