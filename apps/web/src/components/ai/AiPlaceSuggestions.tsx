"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Copy,
  Table2,
  Navigation,
  MapPinned,
  Briefcase,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import {
  PhotoSwipeGalleryTile,
  usePhotoSwipeLightbox,
} from "@/components/trips/photo-swipe-gallery";
import type { Trip } from "@gotrippin/core";
import type { AiPlaceSuggestion } from "@/lib/api/ai";
import { useTranslation } from "react-i18next";
import AiItineraryMap from "@/components/ai/AiItineraryMap";
import { searchImages } from "@/lib/api";
import { getAuthToken } from "@/lib/api/auth";
import { toast } from "sonner";
import {
  fetchPlaceDetailsForEnrichment,
  searchPlaces,
  type GooglePlaceEnrichment,
} from "@/lib/googlePlaces";
import {
  buildGoogleMapsMultiStopDirectionsUrl,
  buildGoogleMapsStopSearchUrl,
} from "@/lib/googleMapsUrls";
import { cn } from "@/lib/utils";
import {
  AiPlaceDetailsDrawerContent,
  aiPlaceSuggestionToDetailsModel,
  formatPlaceTypeLabel,
  formatRatingTextBesideStar,
} from "@/components/ai/AiPlaceDetailsDrawer";
import {
  addAiPlacesToExistingTrip,
  createTripFromAiPlaces,
  placesWithValidCoords,
} from "@/lib/ai/createTripFromAiPlaces";
import { ApiError, fetchTrips } from "@/lib/api/trips";
import { tripCoverBlurHash } from "@/lib/trip-cover-key";
import { resolveTripCoverUrl } from "@/lib/r2-public";

interface AiPlaceSuggestionsProps {
  places: AiPlaceSuggestion[];
  /** When set, this trip is pre-selected in the save picker (trip-scoped chat or attached trip). */
  defaultTargetTripId?: string | null;
}

function tripCoverForSaveRow(tr: Trip): { src: string | null; blurHash: string | null } {
  const blurHash = tripCoverBlurHash(tr);
  const fromUrl = tr.image_url?.trim();
  if (fromUrl && fromUrl.length > 0) {
    return { src: fromUrl, blurHash };
  }
  const fromStorage = resolveTripCoverUrl(tr);
  if (fromStorage) {
    return { src: fromStorage, blurHash };
  }
  return { src: null, blurHash };
}

function placePhotoKey(places: AiPlaceSuggestion[]): string {
  return places.map((p) => [p.name, p.photo_url ?? ""].join("|")).join("\n");
}

/** Stable group identity for Places enrichment (omit mutable photo_url). */
function placeGroupKey(places: AiPlaceSuggestion[]): string {
  return places
    .map((p) => [p.name, p.place_id ?? "", String(p.latitude ?? ""), String(p.longitude ?? "")].join("|"))
    .join("\n");
}

function tsvCell(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}

function mergePlaceWithEnrichment(
  base: AiPlaceSuggestion,
  patch: GooglePlaceEnrichment | undefined,
): AiPlaceSuggestion {
  if (!patch) return base;
  return {
    ...base,
    address: patch.address != null && patch.address.trim() !== "" ? patch.address : base.address,
    rating: patch.rating != null ? patch.rating : base.rating,
    rating_count: patch.rating_count != null ? patch.rating_count : base.rating_count,
    photo_url:
      patch.photo_url != null && patch.photo_url.trim() !== "" ? patch.photo_url : base.photo_url,
    phone_number:
      patch.phone_number != null && patch.phone_number.trim() !== ""
        ? patch.phone_number
        : base.phone_number,
    website:
      patch.website != null && patch.website.trim() !== "" ? patch.website : base.website,
    weekday_hours:
      patch.weekday_hours != null && patch.weekday_hours.length > 0
        ? patch.weekday_hours
        : base.weekday_hours,
    place_type:
      patch.place_type != null && patch.place_type.trim() !== "" ? patch.place_type : base.place_type,
  };
}

export default function AiPlaceSuggestions({ places, defaultTargetTripId }: AiPlaceSuggestionsProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveToTripsLoading, setSaveToTripsLoading] = useState(false);
  const [saveTripDrawerOpen, setSaveTripDrawerOpen] = useState(false);
  const [tripsForSave, setTripsForSave] = useState<Trip[]>([]);
  const [tripsForSaveLoading, setTripsForSaveLoading] = useState(false);
  const [selectedSaveTripId, setSelectedSaveTripId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fallbackPhotosByIndex, setFallbackPhotosByIndex] = useState<
    Record<number, Array<{ url: string; blurHash: string | null }>>
  >({});
  const [enrichmentByIndex, setEnrichmentByIndex] = useState<
    Record<number, GooglePlaceEnrichment>
  >({});

  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrollIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedKeysRef = useRef<Set<string>>(new Set());
  const enrichmentAttemptedRef = useRef<Set<string>>(new Set());
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const heroScrollRafRef = useRef<number | null>(null);
  const tripGalleryGridRef = useRef<HTMLDivElement>(null);
  /** When true, closing the trip-style gallery portal should reopen the place drawer (drawer was closed while viewing photos). */
  const reopenDrawerAfterLightboxRef = useRef(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  /** Same grid + PhotoSwipe as `/trips/.../gallery` ({@link TripGallery}). */
  const [tripGalleryPortal, setTripGalleryPortal] = useState<{
    open: boolean;
    initialSlide: number | null;
  }>({ open: false, initialSlide: null });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const selectedWaypointId =
    places.length > 0 && activeIndex >= 0 && activeIndex < places.length
      ? `ai-place-${activeIndex}`
      : null;

  const placeKey = useMemo(() => placePhotoKey(places), [places]);
  const groupKey = useMemo(() => placeGroupKey(places), [places]);

  useEffect(() => {
    if (places.length === 0) return;
    setActiveIndex((i) => Math.min(Math.max(i, 0), places.length - 1));
  }, [places.length]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const mergedPlaces = useMemo(() => {
    return places.map((p, i) => mergePlaceWithEnrichment(p, enrichmentByIndex[i]));
  }, [places, enrichmentByIndex]);

  const placesWithCoords = useMemo(() => placesWithValidCoords(mergedPlaces), [mergedPlaces]);
  const canSavePlanToTrips = placesWithCoords.length > 0;

  useEffect(() => {
    if (!saveTripDrawerOpen) return;
    let cancelled = false;
    setTripsForSaveLoading(true);
    fetchTrips()
      .then((list) => {
        if (!cancelled) setTripsForSave(list);
      })
      .catch((err) => {
        console.error("[AiPlaceSuggestions] fetchTrips for save picker", err);
        if (!cancelled) {
          setTripsForSave([]);
          toast.error(t("ai.attach_trip_load_failed"));
        }
      })
      .finally(() => {
        if (!cancelled) setTripsForSaveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [saveTripDrawerOpen, t]);

  useEffect(() => {
    if (!saveTripDrawerOpen || tripsForSaveLoading) return;
    if (tripsForSave.length === 0) {
      setSelectedSaveTripId(null);
      return;
    }
    if (defaultTargetTripId && tripsForSave.some((tr) => tr.id === defaultTargetTripId)) {
      setSelectedSaveTripId(defaultTargetTripId);
      return;
    }
    setSelectedSaveTripId((prev) =>
      prev != null && tripsForSave.some((tr) => tr.id === prev) ? prev : tripsForSave[0].id,
    );
  }, [saveTripDrawerOpen, tripsForSaveLoading, tripsForSave, defaultTargetTripId]);

  useEffect(() => {
    setEnrichmentByIndex({});
    enrichmentAttemptedRef.current.clear();
  }, [groupKey]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[AiPlaceSuggestions] Google Places enrichment skipped (NEXT_PUBLIC_GOOGLE_PLACES_API_KEY not set)",
        );
      }
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      for (let i = 0; i < places.length; i += 1) {
        if (cancelled) return;
        const attemptKey = `${groupKey}#${i}`;
        if (enrichmentAttemptedRef.current.has(attemptKey)) continue;
        enrichmentAttemptedRef.current.add(attemptKey);

        const p = places[i];
        if (!p) continue;

        let patch: GooglePlaceEnrichment | null = null;

        const rawPid = p.place_id;
        if (typeof rawPid === "string" && rawPid.trim().length > 0) {
          try {
            patch = await fetchPlaceDetailsForEnrichment(rawPid.trim());
          } catch (err) {
            console.error("[AiPlaceSuggestions] Places details (by place_id) failed", { index: i, err });
          }
        }

        if (!patch) {
          const textQ = [p.name, p.address]
            .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
            .map((x) => x.trim())
            .join(" ")
            .trim();
          if (textQ.length > 0) {
            const locBias =
              typeof p.latitude === "number" &&
              typeof p.longitude === "number" &&
              Number.isFinite(p.latitude) &&
              Number.isFinite(p.longitude)
                ? { lat: p.latitude, lng: p.longitude }
                : undefined;
            try {
              const hits = await searchPlaces(`${textQ}`, locBias);
              const top = hits[0];
              if (top?.id) {
                patch = await fetchPlaceDetailsForEnrichment(top.id);
              }
            } catch (err) {
              console.error("[AiPlaceSuggestions] Places text search / details failed", { index: i, err });
            }
          }
        }

        if (cancelled || !patch) continue;
        setEnrichmentByIndex((prev) => ({ ...prev, [i]: patch }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupKey, places]);

  const activePlace = useMemo(
    () => (mergedPlaces.length === 0 ? null : mergedPlaces[activeIndex] ?? null),
    [mergedPlaces, activeIndex],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) return;
      for (let i = 0; i < places.length; i += 1) {
        const p = places[i];
        if (!p || p.photo_url) continue;
        const fk = `${placeKey}#${i}`;
        if (fetchedKeysRef.current.has(fk)) continue;
        fetchedKeysRef.current.add(fk);
        const query = [p.name, p.address, p.place_type].filter(Boolean).join(" ").trim() || p.name;
        try {
          const res = await searchImages(`${query} travel`, 1, 5, token);
          if (cancelled) return;
          const slides = res.results
            .slice(0, 5)
            .map((img) => {
              const url = img.urls?.small ?? img.urls?.thumb ?? "";
              if (!url) return null;
              return { url, blurHash: img.blur_hash };
            })
            .filter((row): row is { url: string; blurHash: string | null } => row != null);
          if (slides.length === 0) continue;
          setFallbackPhotosByIndex((prev) => {
            if (prev[i] && prev[i].length > 0) return prev;
            return { ...prev, [i]: slides };
          });
        } catch (err) {
          console.error("[AiPlaceSuggestions] fallback image search failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placeKey, places]);

  const resolvePhoto = useCallback(
    (index: number, p: AiPlaceSuggestion) => {
      if (p.photo_url) return { url: p.photo_url, blurHash: null as string | null };
      const list = fallbackPhotosByIndex[index];
      const fb = list?.[0];
      if (fb) return { url: fb.url, blurHash: fb.blurHash };
      return null;
    },
    [fallbackPhotosByIndex],
  );

  const markerThumbnails = useMemo(() => {
    return mergedPlaces.map((p, i) => {
      const ph = resolvePhoto(i, p);
      return ph?.url ?? null;
    });
  }, [mergedPlaces, resolvePhoto]);

  const drawerPhotoSlides = useMemo(() => {
    if (!activePlace) return [];
    const slides: Array<{ url: string; blurHash: string | null }> = [];
    const seen = new Set<string>();
    const push = (url: string | null | undefined, blurHash: string | null) => {
      if (typeof url !== "string" || !url.trim()) return;
      const u = url.trim();
      if (seen.has(u)) return;
      seen.add(u);
      slides.push({ url: u, blurHash });
    };

    const ph = resolvePhoto(activeIndex, activePlace);
    if (ph) push(ph.url, ph.blurHash);

    const extra = enrichmentByIndex[activeIndex]?.extra_photo_urls;
    if (Array.isArray(extra)) {
      for (const u of extra) {
        push(u, null);
      }
    }

    const fbMore = fallbackPhotosByIndex[activeIndex];
    if (Array.isArray(fbMore)) {
      for (const row of fbMore) {
        push(row.url, row.blurHash);
      }
    }

    return slides;
  }, [activePlace, activeIndex, resolvePhoto, enrichmentByIndex, fallbackPhotosByIndex]);

  const gallerySlidesKey = useMemo(
    () => drawerPhotoSlides.map((s) => s.url).join("|"),
    [drawerPhotoSlides],
  );

  useEffect(() => {
    setHeroSlideIndex(0);
    const el = heroScrollRef.current;
    if (el) {
      el.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [activeIndex, gallerySlidesKey, drawerOpen]);

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
    if (!el || drawerPhotoSlides.length === 0) return;
    if (heroScrollRafRef.current != null) return;
    heroScrollRafRef.current = window.requestAnimationFrame(() => {
      heroScrollRafRef.current = null;
      const w = el.clientWidth;
      if (w <= 0) return;
      const maxIdx = drawerPhotoSlides.length - 1;
      const idx = Math.min(maxIdx, Math.max(0, Math.round(el.scrollLeft / w)));
      setHeroSlideIndex((prev) => (prev === idx ? prev : idx));
    });
  }, [drawerPhotoSlides.length]);

  const scrollHeroToSlide = useCallback((index: number) => {
    const el = heroScrollRef.current;
    if (!el || drawerPhotoSlides.length === 0) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const clamped = Math.min(drawerPhotoSlides.length - 1, Math.max(0, index));
    el.scrollTo({ left: clamped * w, behavior: "smooth" });
  }, [drawerPhotoSlides.length]);

  const closeTripGalleryPortal = useCallback(() => {
    const reopenDrawer = reopenDrawerAfterLightboxRef.current;
    reopenDrawerAfterLightboxRef.current = false;
    setTripGalleryPortal({ open: false, initialSlide: null });
    if (reopenDrawer) {
      setDrawerOpen(true);
    }
  }, []);

  const tripGalleryEnabled =
    tripGalleryPortal.open && drawerPhotoSlides.length > 0;
  usePhotoSwipeLightbox(
    tripGalleryGridRef,
    gallerySlidesKey,
    tripGalleryEnabled,
    {
      initialSlideIndex: tripGalleryPortal.open
        ? tripGalleryPortal.initialSlide
        : null,
      onPswpClose: closeTripGalleryPortal,
    },
  );

  useEffect(() => {
    reopenDrawerAfterLightboxRef.current = false;
    setTripGalleryPortal({ open: false, initialSlide: null });
  }, [activeIndex, gallerySlidesKey]);

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

  const openTripGalleryFromDrawer = useCallback((slideIndex: number) => {
    reopenDrawerAfterLightboxRef.current = true;
    setDrawerOpen(false);
    setTripGalleryPortal({ open: true, initialSlide: slideIndex });
  }, []);

  const itineraryPlainText = useMemo(() => {
    return mergedPlaces
      .map((p, i) => {
        const lines: string[] = [`${i + 1}. ${p.name}`];
        if (p.visit_time) lines.push(`   ${p.visit_time}`);
        if (p.address) lines.push(`   ${p.address}`);
        if (p.ai_note) lines.push(`   ${p.ai_note}`);
        return lines.join("\n");
      })
      .join("\n\n");
  }, [mergedPlaces]);

  const itineraryTsv = useMemo(() => {
    const header = ["#", "Visit time", "Name", "Address", "Note"].join("\t");
    const rows = mergedPlaces.map((p, i) =>
      [
        String(i + 1),
        tsvCell(p.visit_time ?? ""),
        tsvCell(p.name),
        tsvCell(p.address ?? ""),
        tsvCell(p.ai_note ?? ""),
      ].join("\t"),
    );
    return [header, ...rows].join("\n");
  }, [mergedPlaces]);

  const directionsUrl = useMemo(
    () => buildGoogleMapsMultiStopDirectionsUrl(mergedPlaces),
    [mergedPlaces],
  );

  const activeStopMapsUrl = useMemo(() => {
    if (!activePlace) return "";
    return buildGoogleMapsStopSearchUrl({
      lat: activePlace.latitude,
      lng: activePlace.longitude,
      name: activePlace.name,
      address: activePlace.address,
    });
  }, [activePlace]);

  const copyPlain = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(itineraryPlainText);
      toast.success(t("ai.itinerary_copied_text"));
    } catch (err) {
      console.error("[AiPlaceSuggestions] clipboard (text) failed", err);
      toast.error(t("ai.itinerary_clipboard_failed"));
    }
  }, [itineraryPlainText, t]);

  const copyTsv = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(itineraryTsv);
      toast.success(t("ai.itinerary_copied_tsv"));
    } catch (err) {
      console.error("[AiPlaceSuggestions] clipboard (tsv) failed", err);
      toast.error(t("ai.itinerary_clipboard_failed"));
    }
  }, [itineraryTsv, t]);

  const openDirections = useCallback(() => {
    if (!directionsUrl) {
      toast.error(t("ai.itinerary_open_route_need_two_coords"));
      return;
    }
    window.open(directionsUrl, "_blank", "noopener,noreferrer");
  }, [directionsUrl, t]);

  const openSaveTripPicker = useCallback(() => {
    setDrawerOpen(false);
    setSaveTripDrawerOpen(true);
  }, []);

  const formatSaveTripDateRange = useCallback(
    (tr: Trip): string | null => {
      const locale = i18n.language;
      const formatOne = (iso: string | null | undefined) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
      };
      const start = formatOne(tr.start_date ?? undefined);
      const end = formatOne(tr.end_date ?? undefined);
      if (start && end) return `${start} – ${end}`;
      return start ?? end ?? null;
    },
    [i18n.language],
  );

  const runCreateNewTripFromPlan = useCallback(async () => {
    if (saveToTripsLoading || !canSavePlanToTrips) return;
    setSaveToTripsLoading(true);
    try {
      const { share_code } = await createTripFromAiPlaces(mergedPlaces);
      setSaveTripDrawerOpen(false);
      toast.success(t("ai.save_plan_to_trips_success"));
      if (placesWithCoords.length === 1) {
        toast.info(t("ai.save_plan_to_trips_one_stop_hint"));
      }
      router.push(`/trips/${share_code}/route`);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "NO_COORDS"
          ? t("ai.save_plan_to_trips_need_coords")
          : err instanceof ApiError
            ? err.message
            : t("ai.save_plan_to_trips_failed");
      console.error("[AiPlaceSuggestions] create new trip from plan failed", err);
      toast.error(msg);
    } finally {
      setSaveToTripsLoading(false);
    }
  }, [saveToTripsLoading, canSavePlanToTrips, mergedPlaces, placesWithCoords.length, router, t]);

  const confirmAppendToExistingTrip = useCallback(async () => {
    if (saveToTripsLoading || !canSavePlanToTrips) return;
    if (!selectedSaveTripId) {
      toast.error(t("ai.save_plan_need_trip"));
      return;
    }
    setSaveToTripsLoading(true);
    try {
      const { share_code } = await addAiPlacesToExistingTrip(selectedSaveTripId, mergedPlaces);
      setSaveTripDrawerOpen(false);
      toast.success(t("ai.save_plan_to_trips_success"));
      if (placesWithCoords.length === 1) {
        toast.info(t("ai.save_plan_to_trips_one_stop_hint"));
      }
      router.push(`/trips/${share_code}/route`);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "NO_COORDS"
          ? t("ai.save_plan_to_trips_need_coords")
          : err instanceof ApiError
            ? err.message
            : t("ai.save_plan_to_trips_failed");
      console.error("[AiPlaceSuggestions] append plan to trip failed", err);
      toast.error(msg);
    } finally {
      setSaveToTripsLoading(false);
    }
  }, [
    saveToTripsLoading,
    canSavePlanToTrips,
    selectedSaveTripId,
    mergedPlaces,
    placesWithCoords.length,
    router,
    t,
  ]);

  const updateActiveFromScroll = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || mergedPlaces.length === 0) return;
    const mid = strip.scrollLeft + strip.clientWidth * 0.5;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < mergedPlaces.length; i += 1) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const left = el.offsetLeft;
      const w = el.offsetWidth;
      const center = left + w * 0.5;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    setActiveIndex((prev) => (prev === best ? prev : best));
  }, [mergedPlaces.length]);

  const onStripScroll = useCallback(() => {
    if (scrollIdleRef.current) clearTimeout(scrollIdleRef.current);
    scrollIdleRef.current = setTimeout(() => {
      scrollIdleRef.current = null;
      updateActiveFromScroll();
    }, 72);
  }, [updateActiveFromScroll]);

  function scrollMiniCardIntoView(index: number) {
    requestAnimationFrame(() => {
      cardRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  }

  function goPrev() {
    setActiveIndex((prev) => {
      if (mergedPlaces.length === 0) return prev;
      const next = (prev - 1 + mergedPlaces.length) % mergedPlaces.length;
      requestAnimationFrame(() => scrollMiniCardIntoView(next));
      return next;
    });
  }

  function goNext() {
    setActiveIndex((prev) => {
      if (mergedPlaces.length === 0) return prev;
      const next = (prev + 1) % mergedPlaces.length;
      requestAnimationFrame(() => scrollMiniCardIntoView(next));
      return next;
    });
  }

  function openDrawerAt(index: number) {
    setActiveIndex(index);
    setDrawerOpen(true);
  }

  if (!places.length) return null;

  return (
    <>
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!canSavePlanToTrips || saveToTripsLoading}
            className="h-9 gap-1.5 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
            onClick={openSaveTripPicker}
          >
            <MapPinned className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
            {t("ai.save_plan_to_trips")}
          </Button>
          {directionsUrl ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 rounded-xl border border-white/12 bg-white/10 text-white hover:bg-white/15"
              onClick={openDirections}
            >
              <Navigation className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              {t("ai.itinerary_open_in_google_maps")}
            </Button>
          ) : null}
        </div>
        <AiItineraryMap
          places={mergedPlaces}
          markerThumbnails={markerThumbnails}
          selectedWaypointId={selectedWaypointId}
          onSelectPlaceIndex={(i) => {
            setActiveIndex(i);
            setDrawerOpen(true);
          }}
        />

        <div
          ref={stripRef}
          onScroll={onStripScroll}
          className="-mt-1 flex touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {mergedPlaces.map((place, index) => {
            const photo = resolvePhoto(index, place);
            const selected = index === activeIndex;
            return (
              <button
                key={`${place.place_id ?? place.name}-${index}`}
                type="button"
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                onClick={() => openDrawerAt(index)}
                className={`flex w-[min(88vw,300px)] shrink-0 snap-center snap-always gap-2.5 overflow-hidden rounded-2xl border px-2.5 py-2 text-left backdrop-blur-xl transition ${
                  selected
                    ? "border-[var(--color-accent)]/55 bg-black/55 ring-1 ring-[var(--color-accent)]/35"
                    : "border-white/12 bg-black/40 hover:border-white/22 hover:bg-black/48"
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                  {photo ? (
                    <CoverImageWithBlur
                      src={photo.url}
                      alt={place.name}
                      blurHash={photo.blurHash ?? undefined}
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/12 to-white/5 text-lg font-semibold text-white/55">
                      {place.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  {place.visit_time ? (
                    <p className="text-[11px] font-medium text-white/55">{place.visit_time}</p>
                  ) : null}
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">{place.name}</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] leading-snug text-white/65">
                    {place.rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="relative top-[0.5px] h-3 w-3 shrink-0 fill-current text-amber-300" />
                        <span className="text-white/70">
                          {formatRatingTextBesideStar(place.rating, place.rating_count)}
                        </span>
                      </span>
                    ) : null}
                    {place.rating != null && place.place_type ? (
                      <span className="text-white/40" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    {place.place_type ? (
                      <span className="text-white/55">{formatPlaceTypeLabel(place.place_type)}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} handleOnly>
        <DrawerContent className="border-white/10 bg-zinc-950 text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DrawerHeader className="border-b border-white/10 pb-3 text-left">
            <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
              <DrawerTitle className="min-w-0 flex-1 text-lg font-semibold text-white">
                {t("ai.place_details")}
              </DrawerTitle>
              {mergedPlaces.length > 1 ? (
                <span className="shrink-0 text-xs font-medium tabular-nums text-white/50">
                  {activeIndex + 1} / {mergedPlaces.length}
                </span>
              ) : null}
              {mergedPlaces.length > 1 ? (
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label={t("ai.carousel_prev")}
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label={t("ai.carousel_next")}
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </DrawerHeader>
          {activePlace ? (
            <AiPlaceDetailsDrawerContent
              details={aiPlaceSuggestionToDetailsModel(activePlace)}
              photoSlides={drawerPhotoSlides}
              heroScrollRef={heroScrollRef}
              heroSlideIndex={heroSlideIndex}
              onHeroGalleryScroll={onHeroGalleryScroll}
              onScrollHeroToSlide={scrollHeroToSlide}
              onOpenPhoto={openTripGalleryFromDrawer}
              mapsUrl={activeStopMapsUrl || null}
              footer={
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                    {t("ai.itinerary_whole_route_actions", { defaultValue: "Whole itinerary" })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!canSavePlanToTrips || saveToTripsLoading}
                      className="h-9 gap-1.5 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
                      onClick={openSaveTripPicker}
                    >
                      <MapPinned className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                      {t("ai.save_plan_to_trips")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 gap-1.5 rounded-xl border border-white/12 bg-white/10 text-white hover:bg-white/15"
                      onClick={() => void copyPlain()}
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                      {t("ai.itinerary_copy_text", { defaultValue: "Copy as text" })}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 gap-1.5 rounded-xl border border-white/12 bg-white/10 text-white hover:bg-white/15"
                      onClick={() => void copyTsv()}
                      title={t("ai.itinerary_copy_tsv_hint")}
                    >
                      <Table2 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                      {t("ai.itinerary_copy_tsv", { defaultValue: "Copy as table" })}
                    </Button>
                    {directionsUrl ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 gap-1.5 rounded-xl border border-white/12 bg-white/10 text-white hover:bg-white/15"
                        onClick={openDirections}
                      >
                        <Navigation className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                        {t("ai.itinerary_open_in_google_maps")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              }
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer open={saveTripDrawerOpen} onOpenChange={setSaveTripDrawerOpen}>
        <DrawerContent className="flex max-h-[min(88dvh,560px)] flex-col">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>{t("ai.save_plan_pick_trip_title")}</DrawerTitle>
            <DrawerDescription className="text-white/50">
              {t("ai.save_plan_pick_trip_hint")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            {tripsForSaveLoading ? (
              <p className="pb-4 text-[13px] text-white/50">
                {t("common.loading", { defaultValue: "Loading…" })}
              </p>
            ) : tripsForSave.length === 0 ? (
              <p className="pb-4 text-[13px] text-white/50">{t("trips.no_trips")}</p>
            ) : (
              <ul className="flex flex-col gap-2 pb-4">
                {tripsForSave.map((tr) => {
                  const primary =
                    (tr.title && tr.title.trim()) ||
                    (tr.destination && tr.destination.trim()) ||
                    t("trips.untitled_trip");
                  const destinationLine =
                    tr.destination?.trim() &&
                    tr.title?.trim() &&
                    tr.destination.trim() !== tr.title.trim()
                      ? tr.destination.trim()
                      : null;
                  const dateLine = formatSaveTripDateRange(tr);
                  const cover = tripCoverForSaveRow(tr);
                  const selected = tr.id === selectedSaveTripId;
                  return (
                    <li key={tr.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSaveTripId(tr.id)}
                        className={cn(
                          "flex w-full gap-3 rounded-xl border p-2.5 text-left transition-colors",
                          selected
                            ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/30"
                            : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]",
                        )}
                      >
                        <div className="relative h-[4.5rem] w-[5.75rem] shrink-0 overflow-hidden rounded-lg bg-white/10">
                          {cover.src ? (
                            <CoverImageWithBlur
                              src={cover.src}
                              alt={primary}
                              blurHash={cover.blurHash ?? undefined}
                              className="h-full w-full"
                              imgClassName="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/30">
                              <Briefcase className="h-8 w-8" strokeWidth={1.25} aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
                          <span className="text-[14px] font-semibold leading-snug text-white/95">
                            {primary}
                          </span>
                          {destinationLine ? (
                            <span className="text-[12px] leading-snug text-white/55">{destinationLine}</span>
                          ) : null}
                          {dateLine ? (
                            <span className="text-[11px] leading-snug text-white/40">{dateLine}</span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="shrink-0 space-y-3 border-t border-white/10 px-4 py-4">
            <Button
              type="button"
              className="h-11 w-full rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 disabled:opacity-50"
              disabled={
                saveToTripsLoading ||
                tripsForSaveLoading ||
                !selectedSaveTripId ||
                tripsForSave.length === 0
              }
              onClick={() => void confirmAppendToExistingTrip()}
            >
              {t("ai.save_plan_confirm_append")}
            </Button>
            <button
              type="button"
              className="w-full text-center text-[13px] text-[var(--color-accent)] underline-offset-2 hover:underline disabled:opacity-50"
              disabled={saveToTripsLoading || !canSavePlanToTrips}
              onClick={() => void runCreateNewTripFromPlan()}
            >
              {t("ai.save_plan_create_new_instead")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {portalTarget != null &&
      tripGalleryPortal.open &&
      activePlace != null &&
      drawerPhotoSlides.length > 0
        ? createPortal(
            <div className="sr-only" aria-hidden>
              <div
                ref={tripGalleryGridRef}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 sm:gap-3"
              >
                {drawerPhotoSlides.map((slide, si) => (
                  <PhotoSwipeGalleryTile
                    key={`${slide.url}-${si}`}
                    url={slide.url}
                    blurHash={slide.blurHash}
                    photoAlt={activePlace.name}
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
