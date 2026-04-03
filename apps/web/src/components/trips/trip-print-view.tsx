"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { bg, enUS } from "date-fns/locale";
import { ArrowRight, Calendar, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Activity, Trip, TripLocation } from "@gotrippin/core";
import { Card } from "@/components/ui/card";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import { resolveTripCoverUrl } from "@/lib/r2";

export interface TripPrintViewProps {
  trip: Trip;
  routeLocations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  unassignedActivities: Activity[];
  shareCode: string;
  autoprint: boolean;
}

function tripAccentForPrint(trip: Trip): string {
  const coverUrl = resolveTripCoverUrl(trip);
  const dom = (trip.cover_photo as { dominant_color?: string | null } | null | undefined)?.dominant_color ?? null;
  const isGradient = Boolean(trip.color?.startsWith("linear-gradient"));
  if (coverUrl) {
    return dom ?? "#ff7670";
  }
  if (trip.color && !isGradient) {
    return trip.color;
  }
  return "#0e0b10";
}

function formatDt(
  iso: string | null | undefined,
  dateLocale: typeof enUS,
  pattern: string
): string {
  if (!iso) {
    return "—";
  }
  try {
    return format(new Date(iso), pattern, { locale: dateLocale });
  } catch {
    return "—";
  }
}

export default function TripPrintView({
  trip,
  routeLocations,
  activitiesByLocation,
  unassignedActivities,
  shareCode,
  autoprint,
}: TripPrintViewProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.toLowerCase().startsWith("bg") ? bg : enUS;

  const coverUrl = resolveTripCoverUrl(trip);
  const blurHash = (trip.cover_photo as { blur_hash?: string | null } | null | undefined)?.blur_hash ?? undefined;
  const tripAccent = tripAccentForPrint(trip);
  const isGradient = Boolean(trip.color?.startsWith("linear-gradient"));
  const backgroundColor =
    !coverUrl && trip.color && !isGradient ? trip.color : tripAccent;

  const title = trip.destination?.trim() || trip.title?.trim() || t("trips.untitled_trip");
  const sortedStops = useMemo(
    () => [...routeLocations].sort((a, b) => a.order_index - b.order_index),
    [routeLocations]
  );

  useEffect(() => {
    if (!autoprint) {
      return;
    }
    let cancelled = false;

    const waitImages = () => {
      const imgs = Array.from(document.images);
      return Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
        )
      );
    };

    const run = async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await waitImages();
      if (cancelled) {
        return;
      }
      window.print();
    };

    const id = window.setTimeout(() => {
      void run();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [autoprint]);

  const gen = format(new Date(), "PPpp", { locale: dateLocale });

  return (
    <div className="trip-print-root min-h-screen bg-[#0e0b10] text-white print:min-h-0">
      <div className="print:hidden sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0e0b10]/95 px-4 py-3 backdrop-blur-md">
        <Link
          href={`/trips/${shareCode}`}
          className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
        >
          ← {t("trips.print_back_to_trip")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            <Printer className="h-4 w-4" />
            {t("trips.print_save_as_pdf")}
          </button>
        </div>
      </div>

      {/* Hero — same building blocks as trip overview (cover + mask + scrim + accent body) */}
      <div className="relative">
        {coverUrl ? (
          <>
            <div
              className="relative h-[min(42vh,320px)] w-full overflow-hidden"
              style={{ background: tripAccent }}
            >
              <CoverImageWithBlur
                src={coverUrl}
                alt={trip.destination || title}
                blurHash={blurHash}
                containerBackground={tripAccent}
                className="absolute inset-0 h-full w-full"
                imgStyle={{
                  maskImage:
                    "linear-gradient(to bottom, black 0%, black 32%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.35) 78%, transparent 92%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, black 32%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.35) 78%, transparent 92%)",
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 px-6 pb-8 pt-16 text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
                  {title}
                </h1>
                {trip.start_date && trip.end_date && (
                  <p className="mt-2 text-sm text-white/85 drop-shadow-md">
                    {formatDt(trip.start_date, dateLocale, "PP")} →{" "}
                    {formatDt(trip.end_date, dateLocale, "PP")}
                  </p>
                )}
              </div>
            </div>
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to bottom, ${tripAccent}, ${tripAccent})`,
              }}
              aria-hidden
            />
          </>
        ) : (
          <div
            className="relative flex min-h-[200px] flex-col justify-end px-6 pb-10 pt-16 text-center"
            style={{
              background: isGradient && trip.color ? trip.color : `linear-gradient(160deg, ${backgroundColor} 0%, #0e0b10 100%)`,
            }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
              {title}
            </h1>
            {trip.start_date && trip.end_date && (
              <p className="mt-2 text-sm text-white/85">
                {formatDt(trip.start_date, dateLocale, "PP")} → {formatDt(trip.end_date, dateLocale, "PP")}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className="relative z-10 space-y-5 bg-[#0e0b10] px-5 pb-10 pt-6 md:px-8"
        style={{ borderTop: `3px solid ${tripAccent}` }}
      >
        <div className="mx-auto max-w-2xl space-y-5">
          <Card className="rounded-2xl border-white/[0.08] bg-[var(--color-card)] p-5 text-card-foreground">
            <p className="text-xs uppercase tracking-wide text-white/60">
              {t("trips.pdf_share_code", { defaultValue: "Share code" })}
            </p>
            <p className="mt-1 font-mono text-sm text-white/90">{trip.share_code}</p>
            {trip.destination?.trim() && (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-white/60">
                  {t("trips.pdf_destination", { defaultValue: "Destination" })}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{trip.destination.trim()}</p>
              </>
            )}
          </Card>

          {trip.description?.trim() && (
            <Card className="border-white/[0.08] bg-[var(--color-card)] p-5 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ff7670]">
                {t("trips.pdf_description", { defaultValue: "Description" })}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/90">{trip.description.trim()}</p>
            </Card>
          )}

          <Card className="border-white/[0.08] rounded-2xl p-5 bg-[var(--color-card)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7670]">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-white/60">{t("trip_overview.route_title")}</span>
                <p className="text-sm font-semibold text-white">{title}</p>
              </div>
            </div>

            {sortedStops.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4">
                <p className="text-sm font-semibold text-white">{t("trip_overview.route_empty_title")}</p>
                <p className="mt-1 text-xs text-white/60">{t("trip_overview.route_empty")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStops.map((location, index) => {
                  const acts = activitiesByLocation[location.id] ?? [];
                  const arrival = location.arrival_date ? new Date(location.arrival_date) : null;
                  const departure = location.departure_date ? new Date(location.departure_date) : null;
                  return (
                    <div key={location.id} className="flex gap-3 break-inside-avoid">
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-2 w-2 rounded-full bg-[#ff7670]" />
                        {index < sortedStops.length - 1 ? (
                          <span className="mt-1 flex-1 w-px grow bg-white/15" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
                            {(index + 1).toString().padStart(2, "0")}
                          </span>
                          <p className="text-lg font-semibold text-white">{location.location_name || t("trips.untitled_trip")}</p>
                        </div>
                        <p className="mt-2 text-[11px] text-white/55">
                          {t("trips.pdf_arrival", { defaultValue: "Arrival" })}:{" "}
                          {formatDt(location.arrival_date, dateLocale, "PPp")} ·{" "}
                          {t("trips.pdf_departure", { defaultValue: "Departure" })}:{" "}
                          {formatDt(location.departure_date, dateLocale, "PPp")}
                        </p>
                        {arrival && departure && (
                          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/80">
                            <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 font-medium">
                              {format(arrival, "MMM d", { locale: dateLocale })}
                            </span>
                            <ArrowRight className="h-3 w-3 text-white/40" />
                            <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 font-medium">
                              {format(departure, "MMM d", { locale: dateLocale })}
                            </span>
                          </p>
                        )}
                        {acts.length > 0 ? (
                          <div className="mt-3 border-t border-white/[0.08] pt-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                              {t("trips.pdf_activities", { defaultValue: "Activities" })}
                            </p>
                            <ul className="mt-2 space-y-2">
                              {acts.map((act) => (
                                <li key={act.id} className="text-sm text-white/90">
                                  <span className="font-medium text-white">• {act.title}</span>{" "}
                                  <span className="text-white/55">({act.type})</span>
                                  {act.start_time ? (
                                    <span className="text-white/50">
                                      {" "}
                                      · {formatDt(act.start_time, dateLocale, "PPp")}
                                    </span>
                                  ) : null}
                                  {act.notes?.trim() ? (
                                    <span className="mt-1 block text-xs text-white/60">{act.notes.trim()}</span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {unassignedActivities.length > 0 ? (
            <Card className="border-white/[0.08] rounded-2xl p-5 bg-[var(--color-card)] break-inside-avoid">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ff7670]">
                {t("trips.pdf_unassigned", { defaultValue: "Other activities" })}
              </p>
              <ul className="mt-3 space-y-2">
                {unassignedActivities.map((act) => (
                  <li key={act.id} className="text-sm text-white/90">
                    <span className="font-medium">• {act.title}</span>{" "}
                    <span className="text-white/55">({act.type})</span>
                    {act.start_time ? (
                      <span className="text-white/50"> · {formatDt(act.start_time, dateLocale, "PPp")}</span>
                    ) : null}
                    {act.notes?.trim() ? (
                      <span className="mt-1 block text-xs text-white/60">{act.notes.trim()}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <p className="pt-4 text-center text-[11px] text-white/45">
            {t("trips.pdf_generated", { defaultValue: "Generated" })} · gotrippin.app · {gen}
          </p>
        </div>
      </div>
    </div>
  );
}
