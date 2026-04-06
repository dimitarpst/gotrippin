"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Trip } from "@gotrippin/core";

import AuroraBackground from "@/components/effects/aurora-background";
import { TripNotesEditor } from "@/components/trips/trip-notes-editor";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NotesPageClient({
  trip,
  shareCode,
}: {
  trip: Trip;
  shareCode: string;
  /** Resolved R2 URL for trip cover — kept for API compatibility with server page. */
  coverImageUrl?: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="z-20 shrink-0 border-b border-border/40 bg-background/20 backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/25">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => router.push(`/trips/${shareCode}`)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground transition-colors hover:bg-muted"
              aria-label={t("trip_notes.back_to_trip", { defaultValue: "Back to trip" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">
                {t("trip_overview.notes_title", { defaultValue: "Trip notes" })}
              </h1>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {t("trip_notes.page_subtitle", {
                  defaultValue: "Rich text, lists, and tasks — saved automatically.",
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="max-w-[5.5rem] text-right text-[11px] leading-tight text-muted-foreground tabular-nums sm:max-w-none sm:text-xs"
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
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15"
                aria-hidden
              >
                <NotebookPen className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-4 pb-safe-bottom sm:px-6 sm:py-5">
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
