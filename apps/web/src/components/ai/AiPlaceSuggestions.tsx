"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Star,
  Clock3,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Table2,
  Navigation,
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import {
  PhotoSwipeGalleryTile,
  usePhotoSwipeLightbox,
} from "@/components/trips/photo-swipe-gallery";
import type { AiPlaceSuggestion } from "@/lib/api/ai";
import { useTranslation } from "react-i18next";
import AiItineraryMap from "@/components/ai/AiItineraryMap";
import { GoAiWordmark } from "@/components/ai/go-ai-wordmark";
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

interface AiPlaceSuggestionsProps {
  places: AiPlaceSuggestion[];
}

function websiteHref(raw: string): string {
  const s = raw.trim();
  if (!s) return "#";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Shown next to a star icon — avoid duplicate ★ in the text. */
function formatRatingTextBesideStar(rating: number, count?: number | null): string {
  if (count == null) return rating.toFixed(1);
  return `${rating.toFixed(1)} (${count.toLocaleString()})`;
}

/** Google `primaryType` is often snake_case; display as Title Case words. */
function formatPlaceTypeLabel(raw: string | null | undefined): string {
  const s = raw?.trim();
  if (!s) return "";
  if (s.includes("_")) {
    return s
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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

export default function AiPlaceSuggestions({ places }: AiPlaceSuggestionsProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
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
                  <p className="line-clamp-1 text-[11px] text-white/65">
                    {place.rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 shrink-0 fill-current text-amber-300" />
                        <span>{formatRatingTextBesideStar(place.rating, place.rating_count)}</span>
                      </span>
                    ) : null}
                    {place.rating != null && place.place_type ? (
                      <span className="text-white/45"> · </span>
                    ) : null}
                    {place.place_type ? (
                      <span className="align-middle">{formatPlaceTypeLabel(place.place_type)}</span>
                    ) : null}
                  </p>
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
            <div className="mx-auto flex w-full max-w-xl flex-col overflow-y-auto p-4 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="mb-4 shrink-0 space-y-2">
                {drawerPhotoSlides.length > 0 ? (
                  <>
                    <div
                      ref={heroScrollRef}
                      onScroll={onHeroGalleryScroll}
                      className="flex touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-white/10 bg-black/25 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {drawerPhotoSlides.map((slide, si) => (
                        <div
                          key={`${slide.url}-${si}`}
                          className="min-w-full shrink-0 snap-center snap-always"
                        >
                          <button
                            type="button"
                            className="block aspect-[16/10] w-full overflow-hidden border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            aria-label={t("trip_gallery.open_lightbox", { defaultValue: "Open photo" })}
                            onClick={() => openTripGalleryFromDrawer(si)}
                          >
                            <CoverImageWithBlur
                              src={slide.url}
                              alt={activePlace.name}
                              blurHash={slide.blurHash ?? undefined}
                              className="h-full w-full"
                              imgClassName="h-full w-full object-cover"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    {drawerPhotoSlides.length > 1 ? (
                      <div
                        className="flex justify-center gap-2 py-1"
                        role="tablist"
                        aria-label={t("ai.photo_gallery", { defaultValue: "Photos" })}
                      >
                        {drawerPhotoSlides.map((_, si) => (
                          <button
                            key={`dot-${si}`}
                            type="button"
                            role="tab"
                            aria-selected={si === heroSlideIndex}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => scrollHeroToSlide(si)}
                            className={cn(
                              "h-2 w-2 rounded-full transition-[opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45",
                              si === heroSlideIndex
                                ? "scale-100 bg-white opacity-100"
                                : "scale-90 bg-white/45 opacity-80 hover:opacity-100",
                            )}
                            aria-label={`${si + 1} / ${drawerPhotoSlides.length}`}
                          />
                        ))}
                      </div>
                    ) : null}
                    <p className="text-center text-xs text-white/45">
                      {t("ai.photo_gallery_hint", {
                        defaultValue:
                          "Tap a photo for the same full-screen viewer as your trip gallery. Swipe the strip sideways to browse photos.",
                      })}
                    </p>
                  </>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/14 to-white/[0.04]">
                    <span className="text-4xl font-semibold text-white/35" aria-hidden>
                      {activePlace.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-4">
              <div className="space-y-1.5">
                {activePlace.visit_time ? (
                  <p className="text-sm font-medium text-white/60">{activePlace.visit_time}</p>
                ) : null}
                <h3 className="text-xl font-semibold leading-tight">{activePlace.name}</h3>
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-white/75">
                  {activePlace.rating != null ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-300" />
                      <span>{formatRatingTextBesideStar(activePlace.rating, activePlace.rating_count)}</span>
                    </span>
                  ) : null}
                  {activePlace.rating != null && activePlace.place_type ? (
                    <span className="text-white/45" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {activePlace.place_type ? (
                    <span className="text-white/80">{formatPlaceTypeLabel(activePlace.place_type)}</span>
                  ) : null}
                </p>
                {activePlace.address ? (
                  <p className="text-sm text-white/70">{activePlace.address}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {activeStopMapsUrl ? (
                  <a
                    href={activeStopMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-accent)] underline-offset-2 hover:underline"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-white/70" />
                    {t("ai.itinerary_open_maps_stop")}
                  </a>
                ) : null}
                {activePlace.website ? (
                  <a
                    href={websiteHref(activePlace.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-accent)] underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 text-white/70" />
                    {t("ai.place_website")}
                  </a>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-3 text-sm text-white/80">
                {activePlace.phone_number ? (
                  <p className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                    <span className="min-w-0 leading-snug">{activePlace.phone_number}</span>
                  </p>
                ) : null}
                {activePlace.weekday_hours && activePlace.weekday_hours.length ? (
                  <p className="flex items-start gap-2.5">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                    <span className="min-w-0 leading-snug">{activePlace.weekday_hours[0]}</span>
                  </p>
                ) : null}
              </div>

              {activePlace.ai_note ? (
                <div className="rounded-xl bg-white/[0.06] px-3 py-3 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                      {t("ai.notes_from_label")}
                    </p>
                    <GoAiWordmark alt="" className="h-4 w-auto max-w-[4rem] shrink-0 object-left object-contain opacity-95" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/88">{activePlace.ai_note}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                  {t("ai.itinerary_whole_route_actions", { defaultValue: "Whole itinerary" })}
                </p>
                <div className="flex flex-wrap gap-2">
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl border border-white/12 bg-white/10 text-white hover:bg-white/15"
                    onClick={openDirections}
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    {t("ai.itinerary_open_route", { defaultValue: "Open route" })}
                  </Button>
                </div>
              </div>
              </div>
            </div>
          ) : null}
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
