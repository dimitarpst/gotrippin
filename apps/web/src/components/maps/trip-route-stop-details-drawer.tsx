"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, List } from "lucide-react";
import type { TripExpense, TripLocation } from "@gotrippin/core";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ColorPicker } from "@/components/color-picker";
import { DatePicker } from "@/components/trips/date-picker";
import {
  PhotoSwipeGalleryTile,
  usePhotoSwipeLightbox,
} from "@/components/trips/photo-swipe-gallery";
import {
  AiPlaceDetailsDrawerContent,
  buildTripStopPhotoSlides,
  mergeTripStopDetailsWithEnrichment,
} from "@/components/ai/AiPlaceDetailsDrawer";
import {
  fetchPlaceDetailsForEnrichment,
  isLikelyValidGooglePlaceIdForDetailsRequest,
  normalizePlacesApiPlaceId,
  type GooglePlaceEnrichment,
} from "@/lib/googlePlaces";
import { buildGoogleMapsStopSearchUrl } from "@/lib/googleMapsUrls";
import { getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors";
import { fetchTripExpenses } from "@/lib/api/trip-expenses";
import {
  expensesByCurrency,
  formatMoneyMinor,
  sumExpensesInCurrency,
} from "@/lib/trip-budget";

function formatDateRangeLabel(range: DateRange | undefined, fallback: string): string {
  if (!range?.from) return fallback;
  const fromStr = range.from.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const toStr = range.to
    ? ` \u2192 ${range.to.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`
    : "";
  return `${fromStr}${toStr}`;
}

export type TripRouteStopDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: TripLocation;
  stopIndex: number;
  totalStops: number;
  shareCode: string;
  minDate?: Date;
  maxDate?: Date;
  expenseTripId?: string;
  tripBudgetCurrency?: string | null;
  editable: boolean;
  onNameCommit?: (id: string, name: string) => void;
  onDatesCommit?: (id: string, range: DateRange | undefined) => void;
  onMarkerColorCommit?: (id: string, hex: string) => void;
  onOpenRouteList?: () => void;
  /** When set, header shows prev/next between sibling route stops. */
  onNavigateAdjacent?: (direction: "prev" | "next") => void;
};

export function TripRouteStopDetailsDrawer({
  open,
  onOpenChange,
  location,
  stopIndex,
  totalStops,
  shareCode,
  minDate,
  maxDate,
  expenseTripId,
  tripBudgetCurrency,
  editable,
  onNameCommit,
  onDatesCommit,
  onMarkerColorCommit,
  onOpenRouteList,
  onNavigateAdjacent,
}: TripRouteStopDetailsDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [enrichment, setEnrichment] = useState<GooglePlaceEnrichment | undefined>(undefined);
  const [draftName, setDraftName] = useState(location.location_name || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stopExpenses, setStopExpenses] = useState<TripExpense[] | null>(null);
  const [stopExpensesFailed, setStopExpensesFailed] = useState(false);

  const heroScrollRef = useRef<HTMLDivElement>(null);
  const heroScrollRafRef = useRef<number | null>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const tripGalleryGridRef = useRef<HTMLDivElement>(null);
  const reopenDrawerAfterLightboxRef = useRef(false);
  const [tripGalleryPortal, setTripGalleryPortal] = useState<{
    open: boolean;
    initialSlide: number | null;
  }>({ open: false, initialSlide: null });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    setDraftName(location.location_name || "");
  }, [location.id, location.location_name]);

  useEffect(() => {
    if (!expenseTripId) {
      setStopExpenses(null);
      setStopExpensesFailed(false);
      return;
    }
    let cancelled = false;
    setStopExpenses(null);
    setStopExpensesFailed(false);
    fetchTripExpenses(expenseTripId, undefined, { locationId: location.id })
      .then((rows) => {
        if (!cancelled) setStopExpenses(rows);
      })
      .catch((err: unknown) => {
        console.error("[TripRouteStopDetailsDrawer] fetchTripExpenses", err);
        if (!cancelled) {
          setStopExpenses([]);
          setStopExpensesFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [expenseTripId, location.id]);

  useEffect(() => {
    if (!open) return;
    const raw = location.google_place_id?.trim();
    const idSeg = raw ? normalizePlacesApiPlaceId(raw) ?? raw : null;
    if (!idSeg || !isLikelyValidGooglePlaceIdForDetailsRequest(idSeg)) {
      setEnrichment(undefined);
      return;
    }
    let cancelled = false;
    setEnrichment(undefined);
    void fetchPlaceDetailsForEnrichment(idSeg)
      .then((patch) => {
        if (!cancelled && patch) setEnrichment(patch);
      })
      .catch((err: unknown) => {
        console.error("[TripRouteStopDetailsDrawer] Places enrichment failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, [open, location.google_place_id]);

  const photoSlides = useMemo(
    () => buildTripStopPhotoSlides(location, enrichment),
    [location, enrichment],
  );

  const gallerySlidesKey = useMemo(() => photoSlides.map((s) => s.url).join("|"), [photoSlides]);

  const details = useMemo(
    () => mergeTripStopDetailsWithEnrichment(location, enrichment),
    [location, enrichment],
  );

  const mapsUrl = useMemo(() => {
    return buildGoogleMapsStopSearchUrl({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.location_name,
      address: location.formatted_address ?? undefined,
    });
  }, [location]);

  useEffect(() => {
    if (!open) return;
    setHeroSlideIndex(0);
    const el = heroScrollRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [open, location.id, gallerySlidesKey]);

  useEffect(() => {
    return () => {
      if (heroScrollRafRef.current != null) {
        cancelAnimationFrame(heroScrollRafRef.current);
        heroScrollRafRef.current = null;
      }
    };
  }, []);

  const onHeroGalleryScroll = useCallback(() => {
    const el = heroScrollRef.current;
    if (!el || photoSlides.length === 0) return;
    if (heroScrollRafRef.current != null) return;
    heroScrollRafRef.current = window.requestAnimationFrame(() => {
      heroScrollRafRef.current = null;
      const w = el.clientWidth;
      if (w <= 0) return;
      const maxIdx = photoSlides.length - 1;
      const idx = Math.min(maxIdx, Math.max(0, Math.round(el.scrollLeft / w)));
      setHeroSlideIndex((prev) => (prev === idx ? prev : idx));
    });
  }, [photoSlides.length]);

  const scrollHeroToSlide = useCallback(
    (index: number) => {
      const el = heroScrollRef.current;
      if (!el || photoSlides.length === 0) return;
      const w = el.clientWidth;
      if (w <= 0) return;
      const clamped = Math.min(photoSlides.length - 1, Math.max(0, index));
      el.scrollTo({ left: clamped * w, behavior: "smooth" });
    },
    [photoSlides.length],
  );

  const closeTripGalleryPortal = useCallback(() => {
    const reopenDrawer = reopenDrawerAfterLightboxRef.current;
    reopenDrawerAfterLightboxRef.current = false;
    setTripGalleryPortal({ open: false, initialSlide: null });
    if (reopenDrawer) {
      onOpenChange(true);
    }
  }, [onOpenChange]);

  const tripGalleryEnabled = tripGalleryPortal.open && photoSlides.length > 0;
  usePhotoSwipeLightbox(tripGalleryGridRef, gallerySlidesKey, tripGalleryEnabled, {
    initialSlideIndex: tripGalleryPortal.open ? tripGalleryPortal.initialSlide : null,
    onPswpClose: closeTripGalleryPortal,
  });

  useEffect(() => {
    reopenDrawerAfterLightboxRef.current = false;
    setTripGalleryPortal({ open: false, initialSlide: null });
  }, [location.id, gallerySlidesKey]);

  useEffect(() => {
    if (!tripGalleryPortal.open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeTripGalleryPortal();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [tripGalleryPortal.open, closeTripGalleryPortal]);

  const openTripGalleryFromDrawer = useCallback(
    (slideIndex: number) => {
      reopenDrawerAfterLightboxRef.current = true;
      onOpenChange(false);
      setTripGalleryPortal({ open: true, initialSlide: slideIndex });
    },
    [onOpenChange],
  );

  const selectedRange: DateRange | undefined = location.arrival_date
    ? {
        from: new Date(location.arrival_date),
        to: location.departure_date ? new Date(location.departure_date) : undefined,
      }
    : undefined;

  const dateLabel = formatDateRangeLabel(selectedRange, t("date_picker.title"));

  const markerPickerValue =
    location.marker_color != null && isSolidRouteColor(location.marker_color)
      ? location.marker_color
      : getStablePaletteColorForLocationId(location.id);

  const stopSpendLabel = useMemo(() => {
    if (!stopExpenses || stopExpenses.length === 0) return null;
    const budgetCur = tripBudgetCurrency?.trim().toUpperCase() ?? null;
    if (budgetCur) {
      const hasInBudgetCur = stopExpenses.some((e) => e.currency_code.toUpperCase() === budgetCur);
      if (hasInBudgetCur) {
        const sum = sumExpensesInCurrency(stopExpenses, budgetCur);
        return formatMoneyMinor(sum, budgetCur);
      }
    }
    const byCur = expensesByCurrency(stopExpenses);
    if (byCur.size === 1) {
      const [code, minor] = [...byCur.entries()][0];
      return formatMoneyMinor(minor, code);
    }
    return t("trip_overview.budget_multi_currency", {
      defaultValue: "Multiple currencies",
    });
  }, [stopExpenses, tripBudgetCurrency, t]);

  const canGoPrev = stopIndex > 0;
  const canGoNext = stopIndex < totalStops - 1;

  const editFooter =
    editable && onNameCommit && onDatesCommit && onMarkerColorCommit ? (
      <div className="mt-4 border-t border-white/[0.07] pt-4">
        <div className="space-y-2.5 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-xs font-medium text-white/55">
            {t("trip_overview.route_stop_editor", { defaultValue: "Edit stop" })}
          </p>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => onNameCommit(location.id, draftName)}
            placeholder={t("trips.untitled_trip")}
            className="min-h-10 w-full min-w-0 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-white/25"
            aria-label={t("trip_overview.route_stop_name_input", { defaultValue: "Stop name" })}
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <div onPointerDown={(e) => e.stopPropagation()}>
              <ColorPicker
                value={markerPickerValue}
                onChange={(hex) => onMarkerColorCommit(location.id, hex)}
                triggerAriaLabel={t("trip_overview.route_marker_color", {
                  defaultValue: "Marker color",
                })}
                className="border border-white/18"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="inline-flex min-h-9 flex-1 min-w-0 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-left text-xs font-medium text-white/88 transition-colors hover:bg-white/10"
              aria-label={`${t("date_picker.title")}: ${dateLabel}`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 text-white/75" strokeWidth={2} aria-hidden />
              <span className="truncate">{dateLabel}</span>
            </button>
          </div>
          {expenseTripId ? (
            <p className="text-[11px] leading-snug text-white/65">
              {stopExpenses === null
                ? t("trip_overview.map_stop_peek_spent_loading", {
                    defaultValue: "Loading spending…",
                  })
                : stopExpensesFailed
                  ? t("trip_overview.map_stop_peek_spent_error", {
                      defaultValue: "Could not load spending for this stop.",
                    })
                  : stopSpendLabel
                    ? t("trip_overview.map_stop_peek_spent", {
                        defaultValue: "Spent on this stop: {{amount}}",
                        amount: stopSpendLabel,
                      })
                    : t("trip_overview.map_stop_peek_spent_none", {
                        defaultValue: "No expenses linked to this stop yet.",
                      })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                router.push(`/trips/${shareCode}/timeline/${location.id}`);
              }}
              className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] py-2 text-[11px] font-semibold text-white/85 hover:bg-white/[0.09] sm:flex-none sm:px-3"
            >
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {t("trip_overview.map_stop_peek_timeline", {
                defaultValue: "Stop details",
              })}
            </button>
            {onOpenRouteList ? (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  queueMicrotask(() => onOpenRouteList());
                }}
                className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] py-2 text-[11px] font-semibold text-white/85 hover:bg-white/[0.09] sm:flex-none sm:px-3"
              >
                <List className="h-3.5 w-3.5" aria-hidden />
                {t("trip_overview.map_stop_peek_open_list", {
                  defaultValue: "Open list",
                })}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    ) : (
      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
        <button
          type="button"
          onClick={() => {
            router.push(`/trips/${shareCode}/timeline/${location.id}`);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
        >
          <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
          {t("trip_overview.map_stop_peek_timeline", {
            defaultValue: "Stop details",
          })}
        </button>
      </div>
    );

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} handleOnly>
        <DrawerContent className="flex max-h-[min(90dvh,720px)] flex-col border-white/10 bg-zinc-950 text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DrawerHeader className="shrink-0 border-b border-white/10 pb-3 text-left">
            <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2">
              <DrawerTitle className="min-w-0 flex-1 text-lg font-semibold text-white">
                {t("ai.place_details")}
              </DrawerTitle>
              {totalStops > 1 ? (
                <span className="shrink-0 text-xs font-medium tabular-nums text-white/50">
                  {stopIndex + 1} / {totalStops}
                </span>
              ) : null}
              {onNavigateAdjacent && totalStops > 1 ? (
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canGoPrev}
                    className="h-9 w-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-35"
                    aria-label={t("trip_overview.route_stop_prev", { defaultValue: "Previous stop" })}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canGoPrev) onNavigateAdjacent("prev");
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canGoNext}
                    className="h-9 w-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-35"
                    aria-label={t("trip_overview.route_stop_next", { defaultValue: "Next stop" })}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canGoNext) onNavigateAdjacent("next");
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </DrawerHeader>
          <AiPlaceDetailsDrawerContent
            details={details}
            photoSlides={photoSlides}
            heroScrollRef={heroScrollRef}
            heroSlideIndex={heroSlideIndex}
            onHeroGalleryScroll={onHeroGalleryScroll}
            onScrollHeroToSlide={scrollHeroToSlide}
            onOpenPhoto={openTripGalleryFromDrawer}
            mapsUrl={mapsUrl || null}
            footer={editFooter}
          />
        </DrawerContent>
      </Drawer>

      {editable && onDatesCommit ? (
        <DatePicker
          open={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(range) => {
            onDatesCommit(location.id, range);
            setShowDatePicker(false);
          }}
          selectedDateRange={selectedRange}
          minDate={minDate}
          maxDate={maxDate}
        />
      ) : null}

      {portalTarget != null &&
      tripGalleryPortal.open &&
      photoSlides.length > 0
        ? createPortal(
            <div className="sr-only" aria-hidden>
              <div
                ref={tripGalleryGridRef}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 sm:gap-3"
              >
                {photoSlides.map((slide, si) => (
                  <PhotoSwipeGalleryTile
                    key={`${slide.url}-${si}`}
                    url={slide.url}
                    blurHash={slide.blurHash}
                    photoAlt={details.name}
                    openLabel={t("trip_gallery.open_lightbox", {
                      defaultValue: "Open photo",
                    })}
                  />
                ))}
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
