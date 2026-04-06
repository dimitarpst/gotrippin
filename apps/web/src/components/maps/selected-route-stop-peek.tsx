"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Calendar, ExternalLink, List, X } from "lucide-react";
import type { TripLocation } from "@gotrippin/core";
import type { DateRange } from "react-day-picker";
import { ColorPicker } from "@/components/color-picker";
import { DatePicker } from "@/components/trips/date-picker";
import { getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors";

export interface SelectedRouteStopPeekProps {
  location: TripLocation;
  stopIndex: number;
  shareCode: string;
  onDismiss: () => void;
  /** Route editor: full edit. Map-only page: read-only + links. */
  editable?: boolean;
  /** Opens the main itinerary drawer (route page). */
  onOpenRouteList?: () => void;
  minDate?: Date;
  maxDate?: Date;
  onNameCommit?: (id: string, name: string) => void;
  onDatesCommit?: (id: string, range: DateRange | undefined) => void;
  onMarkerColorCommit?: (id: string, hex: string) => void;
}

function formatDateRangeLabel(
  range: DateRange | undefined,
  fallback: string,
): string {
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

export function SelectedRouteStopPeek({
  location,
  stopIndex,
  shareCode,
  onDismiss,
  editable = false,
  onOpenRouteList,
  minDate,
  maxDate,
  onNameCommit,
  onDatesCommit,
  onMarkerColorCommit,
}: SelectedRouteStopPeekProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftName, setDraftName] = useState(location.location_name || "");

  useEffect(() => {
    setDraftName(location.location_name || "");
  }, [location.id, location.location_name]);

  const markerPickerValue =
    location.marker_color != null && isSolidRouteColor(location.marker_color)
      ? location.marker_color
      : getStablePaletteColorForLocationId(location.id);

  const selectedRange: DateRange | undefined = location.arrival_date
    ? {
        from: new Date(location.arrival_date),
        to: location.departure_date
          ? new Date(location.departure_date)
          : undefined,
      }
    : undefined;

  const dateLabel = formatDateRangeLabel(
    selectedRange,
    t("date_picker.title"),
  );

  const title =
    draftName.trim() || t("trips.untitled_trip");

  return (
    <>
      <div
        className="max-w-lg mx-auto rounded-2xl border border-white/15 bg-black/90 shadow-2xl backdrop-blur-xl pointer-events-auto ring-1 ring-white/5"
        role="dialog"
        aria-label={t("trip_overview.map_stop_peek_a11y", {
          defaultValue: "Selected route stop",
        })}
      >
        <div className="flex items-start gap-3 p-3 sm:p-3.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-xs font-bold text-white shadow-md"
            style={{ backgroundColor: markerPickerValue }}
            aria-hidden
          >
            {stopIndex + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {editable && onNameCommit ? (
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => onNameCommit(location.id, draftName)}
                  placeholder={t("trips.untitled_trip")}
                  className="min-h-9 w-full min-w-0 border-0 bg-transparent p-0 text-base font-semibold text-white placeholder:text-white/35 outline-none focus:ring-0"
                />
              ) : (
                <p className="min-h-9 text-base font-semibold leading-snug text-white">
                  {title}
                </p>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {editable && onMarkerColorCommit ? (
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <ColorPicker
                      value={markerPickerValue}
                      onChange={(hex) => onMarkerColorCommit(location.id, hex)}
                      triggerAriaLabel={t("trip_overview.route_marker_color", {
                        defaultValue: "Marker color",
                      })}
                      className="border border-white/20"
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={onDismiss}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={t("trip_overview.map_stop_peek_close", {
                    defaultValue: "Close",
                  })}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            {editable && onDatesCommit ? (
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="mt-2 inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/15 sm:w-auto"
                aria-label={`${t("date_picker.title")}: ${dateLabel}`}
              >
                <Calendar className="h-4 w-4 shrink-0 text-white/80" strokeWidth={2} aria-hidden />
                <span>{dateLabel}</span>
              </button>
            ) : (
              <div className="mt-2 inline-flex min-h-10 w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/85 sm:w-auto">
                <Calendar className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2} aria-hidden />
                <span>{dateLabel}</span>
              </div>
            )}
            {!editable ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/trips/${shareCode}/timeline/${location.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  {t("trip_overview.map_stop_peek_timeline", {
                    defaultValue: "Stop details",
                  })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/trips/${shareCode}/route`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  <List className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  {t("trip_overview.map_stop_peek_edit_route", {
                    defaultValue: "Edit route",
                  })}
                </button>
              </div>
            ) : onOpenRouteList ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/trips/${shareCode}/timeline/${location.id}`);
                  }}
                  className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 sm:flex-none sm:px-4"
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  {t("trip_overview.map_stop_peek_timeline", {
                    defaultValue: "Stop details",
                  })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenRouteList();
                  }}
                  className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 sm:flex-none sm:px-4"
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  {t("trip_overview.map_stop_peek_open_list", {
                    defaultValue: "Open list",
                  })}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
    </>
  );
}
