"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import MapView from "@/components/maps/MapView";
import type { AiPlaceSuggestion } from "@/lib/api/ai";

const WAYPOINT_ID_PREFIX = "ai-place-";

export interface AiItineraryMapProps {
  places: AiPlaceSuggestion[];
  /** Highlight marker for the active place (mini card / map tap). */
  selectedWaypointId: string | null;
  onSelectPlaceIndex: (index: number) => void;
  className?: string;
  /** Resolved image URL per place index (e.g. Unsplash fallback); parallel to `places`. */
  markerThumbnails?: ReadonlyArray<string | null | undefined>;
}

export default function AiItineraryMap({
  places,
  selectedWaypointId,
  onSelectPlaceIndex,
  className,
  markerThumbnails,
}: AiItineraryMapProps) {
  const { t } = useTranslation();

  const waypoints = useMemo(() => {
    const out: Array<{
      lat: number;
      lng: number;
      name?: string;
      id: string;
      orderIndex: number;
      markerLetter: string;
      thumbnailUrl: string | null;
    }> = [];
    places.forEach((p, i) => {
      const lat = p.latitude;
      const lng = p.longitude;
      if (typeof lat !== "number" || !Number.isFinite(lat)) return;
      if (typeof lng !== "number" || !Number.isFinite(lng)) return;
      const fromProp = markerThumbnails?.[i];
      const thumbFromProp =
        typeof fromProp === "string" && fromProp.trim().length > 0 ? fromProp.trim() : null;
      const thumbFromPlace =
        typeof p.photo_url === "string" && p.photo_url.trim().length > 0 ? p.photo_url.trim() : null;
      const nm = p.name?.trim() ?? "";
      out.push({
        lat,
        lng,
        name: p.name,
        id: `${WAYPOINT_ID_PREFIX}${i}`,
        orderIndex: i + 1,
        markerLetter: nm.length > 0 ? nm.charAt(0).toUpperCase() : "?",
        thumbnailUrl: thumbFromProp ?? thumbFromPlace,
      });
    });
    return out;
  }, [places, markerThumbnails]);

  const focusLngLat = useMemo(() => {
    if (!selectedWaypointId || !selectedWaypointId.startsWith(WAYPOINT_ID_PREFIX)) return null;
    const idx = Number.parseInt(selectedWaypointId.slice(WAYPOINT_ID_PREFIX.length), 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= places.length) return null;
    const p = places[idx];
    if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return null;
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) return null;
    return { lng: p.longitude, lat: p.latitude };
  }, [selectedWaypointId, places]);

  if (waypoints.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50 ${className ?? ""}`}
      >
        {t("ai.map_need_coords")}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[260px] h-[42vh] max-h-[520px] w-full overflow-hidden rounded-2xl border border-white/15 bg-black/30 ${className ?? ""}`}
    >
      <MapView
        waypoints={waypoints}
        fitToRoute
        interactive
        fitPadding={52}
        focusLngLat={focusLngLat}
        selectedWaypointId={selectedWaypointId}
        showZoomControls
        zoomInLabel={t("ai.map_zoom_in")}
        zoomOutLabel={t("ai.map_zoom_out")}
        waypointMarkerDisplay="square"
        onWaypointClick={(detail) => {
          if (detail.id.startsWith(WAYPOINT_ID_PREFIX)) {
            const idx = Number.parseInt(detail.id.slice(WAYPOINT_ID_PREFIX.length), 10);
            if (!Number.isNaN(idx)) onSelectPlaceIndex(idx);
          }
        }}
      />
    </div>
  );
}
