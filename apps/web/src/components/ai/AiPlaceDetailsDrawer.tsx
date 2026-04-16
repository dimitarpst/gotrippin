"use client";

import type { ReactNode, RefObject } from "react";
import { Star, Clock3, Phone, MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TripLocation } from "@gotrippin/core";
import type { AiPlaceSuggestion } from "@/lib/api/ai";
import type { GooglePlaceEnrichment } from "@/lib/googlePlaces";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import { GoAiWordmark } from "@/components/ai/go-ai-wordmark";
import { cn } from "@/lib/utils";

/** Shown next to a star icon — avoid duplicate ★ in the text. */
export function formatRatingTextBesideStar(rating: number, count?: number | null): string {
  if (count == null) return rating.toFixed(1);
  return `${rating.toFixed(1)} (${count.toLocaleString()})`;
}

/** Google `primaryType` is often snake_case; display as Title Case words. */
export function formatPlaceTypeLabel(raw: string | null | undefined): string {
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

export function websiteHref(raw: string): string {
  const s = raw.trim();
  if (!s) return "#";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export type AiPlaceDetailsModel = {
  name: string;
  visitTime?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  placeType?: string | null;
  address?: string | null;
  website?: string | null;
  phoneNumber?: string | null;
  weekdayHours?: string[] | null;
  aiNote?: string | null;
};

export function aiPlaceSuggestionToDetailsModel(p: AiPlaceSuggestion): AiPlaceDetailsModel {
  return {
    name: p.name,
    visitTime: p.visit_time ?? null,
    rating: p.rating ?? null,
    ratingCount: p.rating_count ?? null,
    placeType: p.place_type ?? null,
    address: p.address ?? null,
    website: p.website ?? null,
    phoneNumber: p.phone_number ?? null,
    weekdayHours: p.weekday_hours ?? null,
    aiNote: p.ai_note ?? null,
  };
}

export function tripLocationToDetailsModel(loc: TripLocation): AiPlaceDetailsModel {
  return {
    name: loc.location_name,
    visitTime: null,
    rating: null,
    ratingCount: null,
    placeType: null,
    address: loc.formatted_address ?? null,
    website: null,
    phoneNumber: null,
    weekdayHours: null,
    aiNote: null,
  };
}

export function mergeTripStopDetailsWithEnrichment(
  loc: TripLocation,
  en: GooglePlaceEnrichment | undefined,
): AiPlaceDetailsModel {
  const base = tripLocationToDetailsModel(loc);
  if (!en) return base;
  const addr = en.address?.trim();
  return {
    ...base,
    address: addr != null && addr.length > 0 ? addr : base.address,
    rating: en.rating ?? base.rating,
    ratingCount: en.rating_count ?? base.ratingCount,
    placeType:
      en.place_type != null && en.place_type.trim().length > 0 ? en.place_type : base.placeType,
    website: en.website != null && en.website.trim().length > 0 ? en.website : base.website,
    phoneNumber:
      en.phone_number != null && en.phone_number.trim().length > 0
        ? en.phone_number
        : base.phoneNumber,
    weekdayHours:
      en.weekday_hours != null && en.weekday_hours.length > 0 ? en.weekday_hours : base.weekdayHours,
  };
}

export function buildTripStopPhotoSlides(
  loc: TripLocation,
  en: GooglePlaceEnrichment | undefined,
): AiPlaceDetailsPhotoSlide[] {
  const slides: AiPlaceDetailsPhotoSlide[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined, blurHash: string | null) => {
    const u = url?.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    slides.push({ url: u, blurHash });
  };
  push(loc.photo_url, null);
  push(en?.photo_url, null);
  if (en?.extra_photo_urls) {
    for (const u of en.extra_photo_urls) {
      push(u, null);
    }
  }
  return slides;
}

export type AiPlaceDetailsPhotoSlide = { url: string; blurHash: string | null };

export type AiPlaceDetailsDrawerContentProps = {
  details: AiPlaceDetailsModel;
  photoSlides: AiPlaceDetailsPhotoSlide[];
  heroScrollRef: RefObject<HTMLDivElement | null>;
  heroSlideIndex: number;
  onHeroGalleryScroll: () => void;
  onScrollHeroToSlide: (index: number) => void;
  /** When omitted, hero images are not wrapped in a lightbox trigger. */
  onOpenPhoto?: (slideIndex: number) => void;
  mapsUrl: string | null;
  footer?: ReactNode;
};

export function AiPlaceDetailsDrawerContent({
  details,
  photoSlides,
  heroScrollRef,
  heroSlideIndex,
  onHeroGalleryScroll,
  onScrollHeroToSlide,
  onOpenPhoto,
  mapsUrl,
  footer,
}: AiPlaceDetailsDrawerContentProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mb-4 shrink-0 space-y-2">
        {photoSlides.length > 0 ? (
          <>
            <div
              ref={heroScrollRef}
              onScroll={onHeroGalleryScroll}
              className="flex touch-pan-x snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-white/10 bg-black/25 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {photoSlides.map((slide, si) => (
                <div key={`${slide.url}-${si}`} className="min-w-full shrink-0 snap-center snap-always">
                  {onOpenPhoto ? (
                    <button
                      type="button"
                      className="block aspect-[16/10] w-full overflow-hidden border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      aria-label={t("trip_gallery.open_lightbox", { defaultValue: "Open photo" })}
                      onClick={() => onOpenPhoto(si)}
                    >
                      <CoverImageWithBlur
                        src={slide.url}
                        alt={details.name}
                        blurHash={slide.blurHash ?? undefined}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-none">
                      <CoverImageWithBlur
                        src={slide.url}
                        alt={details.name}
                        blurHash={slide.blurHash ?? undefined}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {photoSlides.length > 1 ? (
              <div
                className="flex justify-center gap-2 py-1"
                role="tablist"
                aria-label={t("ai.photo_gallery", { defaultValue: "Photos" })}
              >
                {photoSlides.map((_, si) => (
                  <button
                    key={`dot-${si}`}
                    type="button"
                    role="tab"
                    aria-selected={si === heroSlideIndex}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onScrollHeroToSlide(si)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-[opacity,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45",
                      si === heroSlideIndex
                        ? "scale-100 bg-white opacity-100"
                        : "scale-90 bg-white/45 opacity-80 hover:opacity-100",
                    )}
                    aria-label={`${si + 1} / ${photoSlides.length}`}
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
              {details.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4">
        <div className="space-y-1.5">
          {details.visitTime ? (
            <p className="text-sm font-medium text-white/60">{details.visitTime}</p>
          ) : null}
          <h3 className="text-xl font-semibold leading-tight">{details.name}</h3>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-white/75">
            {details.rating != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-300" />
                <span>{formatRatingTextBesideStar(details.rating, details.ratingCount)}</span>
              </span>
            ) : null}
            {details.rating != null && details.placeType ? (
              <span className="text-white/45" aria-hidden>
                ·
              </span>
            ) : null}
            {details.placeType ? (
              <span className="text-white/80">{formatPlaceTypeLabel(details.placeType)}</span>
            ) : null}
          </p>
          {details.address ? <p className="text-sm text-white/70">{details.address}</p> : null}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              <MapPin className="h-4 w-4 shrink-0 text-white/70" />
              {t("ai.itinerary_open_maps_stop")}
            </a>
          ) : null}
          {details.website ? (
            <a
              href={websiteHref(details.website)}
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
          {details.phoneNumber ? (
            <p className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
              <span className="min-w-0 leading-snug">{details.phoneNumber}</span>
            </p>
          ) : null}
          {details.weekdayHours && details.weekdayHours.length ? (
            <div className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
              <div className="min-w-0 max-h-48 space-y-1 overflow-y-auto leading-snug">
                {details.weekdayHours.map((line, hi) => (
                  <p key={`hours-line-${hi}`} className="text-sm text-white/80">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {details.aiNote ? (
          <div className="rounded-xl bg-white/[0.06] px-3 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                {t("ai.notes_from_label")}
              </p>
              <GoAiWordmark
                alt=""
                className="h-4 w-auto max-w-[4rem] shrink-0 object-left object-contain opacity-95"
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/88">{details.aiNote}</p>
          </div>
        ) : null}

        {footer}
      </div>
    </div>
  );
}
