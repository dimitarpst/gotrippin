"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip } from "@gotrippin/core";
import { averageRgbFromImageDataSampled, rgbToHex } from "@gotrippin/core";

import AuroraBackground from "@/components/effects/aurora-background";
import { TripNotesEditor } from "@/components/trips/trip-notes-editor";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NotesPageClient({
  trip,
  shareCode,
  coverImageUrl,
}: {
  trip: Trip;
  shareCode: string;
  /** Resolved R2 URL for trip cover (optional accent sampling). */
  coverImageUrl?: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [dominantColor, setDominantColor] = useState<string | null>(null);

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
  const isGradient = trip.color ? trip.color.startsWith("linear-gradient") : false;
  const themeColor =
    hasCoverImage && dominantColor
      ? dominantColor
      : trip.color && !isGradient
        ? trip.color
        : null;
  const themeHex = themeColor ?? "#1a1a2e";

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-border/60 bg-card/80 px-3 py-2.5 backdrop-blur-md sm:px-5 dark:border-white/[0.08] dark:bg-[#0e0b10]/85">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push(`/trips/${shareCode}`)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-accent dark:border-white/15 dark:bg-white/10 dark:text-white"
              aria-label={t("trip_notes.back_to_trip", { defaultValue: "Back to trip" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm sm:h-8 sm:w-8"
              style={{ background: `linear-gradient(135deg, ${themeHex} 0%, #ff7670 100%)` }}
            >
              <NotebookPen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                  {t("trip_overview.notes_title", { defaultValue: "Trip notes" })}
                </h1>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px] leading-snug sm:text-xs">
                  {t("trip_notes.page_subtitle", {
                    defaultValue: "Rich text, lists, and tasks — saved automatically.",
                  })}
                </p>
              </div>
              <span
                className="shrink-0 pt-0.5 text-right text-xs text-muted-foreground tabular-nums sm:text-sm"
                aria-live="polite"
              >
                {saveState === "saving"
                  ? t("trip_overview.notes_saving", { defaultValue: "Saving…" })
                  : saveState === "saved"
                    ? t("trip_overview.notes_saved", { defaultValue: "Saved" })
                    : saveState === "error"
                      ? t("trip_overview.notes_error", { defaultValue: "Not saved" })
                      : null}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 pb-safe-bottom sm:px-6 sm:py-4">
          <TripNotesEditor
            key={trip.id}
            tripId={trip.id}
            initialNotesRaw={trip.notes}
            onSaveStateChange={setSaveState}
            className="min-h-0 flex-1"
          />
        </div>
      </div>
    </main>
  );
}
