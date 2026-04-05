"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip, TripGalleryImage } from "@gotrippin/core";
import { averageRgbFromImageDataSampled, rgbToHex } from "@gotrippin/core";

import AuroraBackground from "@/components/effects/aurora-background";
import { TripGallery } from "@/components/trips/trip-gallery";
import { resolveTripCoverUrl } from "@/lib/r2";
import { tripCoverStorageKey } from "@/lib/trip-cover-key";

export default function GalleryPageClient({
  trip,
  shareCode,
  initialGallery,
}: {
  trip: Trip;
  shareCode: string;
  initialGallery: TripGalleryImage[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const [tripFromSetCover, setTripFromSetCover] = useState<Trip | null>(null);

  const displayTrip = tripFromSetCover ?? trip;
  const coverImageUrl = resolveTripCoverUrl(displayTrip);

  useEffect(() => {
    if (!tripFromSetCover) {
      return;
    }
    const a = tripCoverStorageKey(tripFromSetCover);
    const b = tripCoverStorageKey(trip);
    if (a !== null && b !== null && a === b) {
      setTripFromSetCover(null);
    }
  }, [trip, tripFromSetCover]);

  useEffect(() => {
    if (!coverImageUrl) {
      setDominantColor(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverImageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const y0 = Math.floor(canvas.height * 0.65);
        const regionHeight = canvas.height - y0;
        const imageData = ctx.getImageData(0, y0, canvas.width, regionHeight);
        const raw = averageRgbFromImageDataSampled(imageData, 10);
        setDominantColor(rgbToHex(raw.r, raw.g, raw.b));
      } catch {
        setDominantColor(null);
      }
    };
    img.onerror = () => setDominantColor(null);
  }, [coverImageUrl]);

  const hasCoverImage = !!coverImageUrl;
  const isGradient = displayTrip.color
    ? displayTrip.color.startsWith("linear-gradient")
    : false;
  const themeColor =
    hasCoverImage && dominantColor
      ? dominantColor
      : displayTrip.color && !isGradient
        ? displayTrip.color
        : null;
  const themeHex = themeColor ?? "#1a1a2e";

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border/60 bg-card/80 px-3 py-2 backdrop-blur-md sm:px-5 dark:border-white/[0.08] dark:bg-[#0e0b10]/85">
          <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => router.push(`/trips/${shareCode}`)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-accent dark:border-white/15 dark:bg-white/10 dark:text-white"
              aria-label={t("trip_gallery.back_to_trip", {
                defaultValue: "Back to trip",
              })}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white shadow-sm sm:h-8 sm:w-8 sm:rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${themeHex} 0%, #ff7670 100%)`,
              }}
            >
              <Images className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {t("trip_overview.gallery_title", {
                defaultValue: "Trip gallery",
              })}
            </h1>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 pb-safe-bottom sm:px-6 sm:py-4">
          <TripGallery
            trip={displayTrip}
            tripId={trip.id}
            initialImages={initialGallery}
            coverImageUrl={coverImageUrl ?? null}
            onCoverPersistedFromApi={setTripFromSetCover}
          />
        </div>
      </div>
    </main>
  );
}
