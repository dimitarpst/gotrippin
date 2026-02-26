"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip, TripLocation } from "@gotrippin/core";
import { MapView, tripLocationsToWaypoints } from "@/components/maps";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

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

  const waypoints = tripLocationsToWaypoints(routeLocations);

  const stopNames = routeLocations
    .map((loc) => loc.location_name)
    .filter(Boolean);
  const routeSummary =
    stopNames.length > 1 ? `${stopNames[0]} \u2192 ${stopNames[stopNames.length - 1]}` : stopNames[0] ?? "";

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
          <div className="px-4 pb-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-white/60">
                {t("trip_overview.route_title")}
              </span>
              <span className="text-sm font-semibold text-white">
                {routeSummary || trip.destination || trip.title || t("trips.untitled_trip")}
              </span>
            </div>
            <div className="text-xs text-white/60">
              {routeLocations.length === 0
                ? t("trip_overview.route_empty_title")
                : routeLocations.length === 1
                ? "1 stop"
                : `${routeLocations.length} stops`}
            </div>
          </div>

          {/* Route list (read-only for Phase 1) */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {routeLocations.length === 0 ? (
              <p className="text-sm text-white/60">
                {t("trip_overview.route_empty")}
              </p>
            ) : (
              routeLocations.map((loc, index) => {
                const hasArrival = !!loc.arrival_date;
                const hasDeparture = !!loc.departure_date;

                let dateLabel = "";
                if (hasArrival) {
                  const from = new Date(loc.arrival_date as string);
                  const to = hasDeparture ? new Date(loc.departure_date as string) : null;
                  const fromStr = from.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const toStr = to
                    ? ` \u2192 ${to.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}`
                    : "";
                  dateLabel = `${fromStr}${toStr}`;
                }

                return (
                  <div
                    key={loc.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-3"
                  >
                    <div className="flex flex-col items-center mr-1">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 border border-white/10">
                        {index + 1}
                      </div>
                      {index < routeLocations.length - 1 && (
                        <div className="flex-1 w-px bg-white/10 mt-1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {loc.location_name || t("trips.untitled_trip")}
                      </div>
                      {dateLabel && (
                        <div className="text-xs text-white/60 mt-0.5">
                          {dateLabel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

