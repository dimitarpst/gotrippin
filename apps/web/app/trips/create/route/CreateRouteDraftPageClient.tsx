"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, Loader2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TripCreateData } from "@gotrippin/core";
import { MapView } from "@/components/maps";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/trips/date-picker";
import type { DateRange } from "react-day-picker";
import { addLocation as apiAddLocation } from "@/lib/api/trip-locations";
import { useGooglePlaces } from "@/hooks";
import { toast } from "sonner";
import { createTripAction } from "@/actions/trips";

const DRAFT_KEY = "createTripDraft";

function parseDraft(raw: string | null): TripCreateData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed?.title !== "string") return null;
    return parsed as TripCreateData;
  } catch {
    return null;
  }
}

export default function CreateRouteDraftPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TripCreateData | null>(null);
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
  const hasAutoOpenedSearchRef = useRef(false);
  const { results: placeResults, loading: placesLoading, error: placesError, search } = useGooglePlaces();

  useEffect(() => {
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(DRAFT_KEY) : null;
    const parsed = parseDraft(raw);
    if (!parsed) {
      router.replace("/trips/create");
      return;
    }
    setDraft(parsed);
  }, [router]);

  useEffect(() => {
    if (!draft) return;
    if (hasAutoOpenedSearchRef.current) return;
    hasAutoOpenedSearchRef.current = true;
    setSearchOpen(true);
    const title = typeof draft.title === "string" ? draft.title : "";
    setSearchQuery(title);
  }, [draft]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (!q) return;
    const id = setTimeout(() => search(q), 300);
    return () => clearTimeout(id);
  }, [searchOpen, searchQuery, search]);

  const waypoints = previewPlace
    ? [{ lat: previewPlace.lat, lng: previewPlace.lng, name: previewPlace.name }]
    : [];

  const handleConfirmAddPlace = async () => {
    if (!previewPlace || !draft || addingPlaceId) return;
    if (!previewDateRange?.from) return;
    setAddingPlaceId(previewPlace.id);
    try {
      const result = await createTripAction(draft);
      if (!result.success) {
        toast.error(t("trips.create_failed", { defaultValue: "Failed to create trip" }), {
          description: result.error,
        });
        setAddingPlaceId(null);
        return;
      }
      const trip = result.data;
      if (!trip?.id) {
        toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }));
        setAddingPlaceId(null);
        return;
      }
      const payload = {
        location_name: previewPlace.name,
        latitude: previewPlace.lat,
        longitude: previewPlace.lng,
        order_index: 1,
        arrival_date: previewDateRange.from.toISOString(),
        departure_date: previewDateRange.to
          ? previewDateRange.to.toISOString()
          : previewDateRange.from.toISOString(),
      };
      await apiAddLocation(trip.id, payload);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast.success(t("trip_overview.route_stop_added"));
      if (trip.share_code) {
        router.push(`/trips/${trip.share_code}/route?wizard=1`);
      } else {
        router.push("/trips");
      }
    } catch (error) {
      console.error("Failed to create trip and add first stop", error);
      toast.error(t("trip_overview.route_add_stop_failed"));
    } finally {
      setAddingPlaceId(null);
    }
  };

  if (!draft) {
    return null;
  }

  const draftTitle = typeof draft.title === "string" ? draft.title : "";
  const draftMinDate = draft.start_date ? new Date(draft.start_date) : undefined;
  const draftMaxDate = draft.end_date ? new Date(draft.end_date) : undefined;

  return (
    <div className="h-screen w-full bg-[#0a0a0a] relative overflow-hidden">
      <MapView
        waypoints={waypoints}
        fitToRoute={waypoints.length > 0}
        className="absolute inset-0"
        focusLngLat={focusLngLat}
        focusZoom={14}
        previewLngLat={previewPlace ? { lng: previewPlace.lng, lat: previewPlace.lat } : null}
        defaultCenter={waypoints.length === 0 ? { lng: 23.32, lat: 42.7 } : undefined}
        defaultZoom={waypoints.length === 0 ? 10 : undefined}
      />

      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => router.replace("/trips/create")}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors pointer-events-auto shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase tracking-wide text-white/80 font-medium drop-shadow-md block">
              {t("trip_overview.route_map_title")}
            </span>
            <span className="text-sm font-semibold text-white truncate block">{draftTitle || t("trips.untitled_trip")}</span>
          </div>
        </div>
      </div>

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
              <p className="text-sm text-white/50 py-2 break-words">{t("trip_overview.route_search_no_results")}</p>
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
                        });
                        setFocusLngLat({ lng: place.lng, lat: place.lat });
                        setSearchOpen(false);
                      }}
                      className="w-full min-w-0 text-left rounded-lg px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/15 text-xs font-medium text-white flex flex-col gap-0.5 overflow-hidden"
                    >
                      <span className="block truncate min-w-0">{place.name}</span>
                      {place.address && (
                        <span className="block text-[11px] text-white/55 truncate min-w-0">{place.address}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 space-y-3 pointer-events-none">
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
                <p className="text-xs text-white/70">{t("trip_overview.route_search_confirm_hint")}</p>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium text-white truncate text-sm">{previewPlace.name}</span>
                  {previewPlace.address && (
                    <span className="text-[11px] text-white/55 truncate block">{previewPlace.address}</span>
                  )}
                </div>
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
                    disabled={!!addingPlaceId}
                    onClick={() => {
                      if (!previewDateRange?.from) {
                        setPreviewPlace(null);
                        setPreviewDateRange(undefined);
                        setFocusLngLat(null);
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
                minDate={draftMinDate}
                maxDate={draftMaxDate}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
