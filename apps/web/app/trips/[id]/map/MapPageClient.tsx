"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Map as MapIcon, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip, TripLocation } from "@gotrippin/core";
import type { MapWaypoint } from "@/components/maps";
import { MapView, tripLocationsToWaypoints } from "@/components/maps";
import { useRouteDirections } from "@/hooks";

function MapViewWithRoute({ waypoints }: { waypoints: MapWaypoint[] }) {
  const { routeGeo } = useRouteDirections(waypoints);
  return (
    <MapView
      waypoints={waypoints}
      routeLineGeo={routeGeo}
      fitToRoute
      fitPadding={80}
      className="w-full h-full"
    />
  );
}

interface MapPageClientProps {
  trip: Trip;
  routeLocations: TripLocation[];
  shareCode: string;
}

export default function MapPageClient({
  trip,
  routeLocations,
  shareCode,
}: MapPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  return (
    <div className="h-screen w-full bg-[#0a0a0a] relative overflow-hidden flex flex-col">
      {/* Floating Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
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

      {/* Map Content */}
      <div className="absolute inset-0 z-0">
        {routeLocations.length > 0 ? (
          <MapViewWithRoute waypoints={tripLocationsToWaypoints(routeLocations)} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-6 pointer-events-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <MapIcon className="w-8 h-8 text-white/50" />
            </div>
            <p className="text-xl font-medium text-white/90 mb-2">{t("trip_overview.route_empty_title")}</p>
            <p className="text-sm text-white/50 max-w-xs">{t("trip_overview.route_empty")}</p>
          </div>
        )}
      </div>

      {/* Floating Route Legend / Info Panel that links to the route editor */}
      {routeLocations.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute bottom-6 left-4 right-4 z-10 pointer-events-none"
        >
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => router.push(`/trips/${shareCode}/route`)}
              className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl pointer-events-auto w-full text-left hover:bg-black/70 active:scale-[0.98] transition-transform transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label={t("trip_overview.route_title")}
            >
              <div className="w-10 h-10 rounded-full bg-[#ff6b6b]/20 flex items-center justify-center flex-shrink-0 border border-[#ff6b6b]/30">
                <Navigation className="w-5 h-5 text-[#ff6b6b]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-white truncate">
                  {routeLocations.length} Stops · {t("trip_overview.route_edit_cta")}
                </span>
                <span className="text-xs text-white/60 truncate">
                  {routeLocations.map((l) => l.location_name).filter(Boolean).join(" → ")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
