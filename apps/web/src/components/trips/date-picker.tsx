"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { type DateRange } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { format, isSameDay, isSameMonth, isWithinInterval, startOfDay } from "date-fns";
import type { Matcher } from "react-day-picker";
import type { Activity, TripLocation } from "@gotrippin/core";
import { toast } from "sonner";

const ROUTE_DOT_COLORS = [
  "#ff7670",
  "#4ecdc4",
  "#ffe66d",
  "#a8dadc",
  "#c8b6ff",
  "#95d5b2",
];

export type GlassFillGridCell = { row: number; col: number };

/**
 * 5×5 frame (row 1 = top, row 5 = bottom of the day cell; corners empty).
 * Fill like a glass: finish the bottom edge `01110` before any row `10001`, then add each
 * `10001` from the bottom upward, then the top edge (same center-out as bottom).
 *
 * Examples (row 1 at top of each block):
 * - 5 dots (e.g. “13”): row4 `10001`, row5 `01110`
 * - 7 dots (“15”): row3–4 `10001`, row5 `01110`
 * - 9 dots (“14”): row2–4 `10001`, row5 `01110`
 */
const GLASS_FILL_PERIMETER_SLOTS: GlassFillGridCell[] = [
  // Row 5 bottom: center → flanks → full 01110 (same as 0-1-0, 0-11-0, 01110)
  { row: 5, col: 3 },
  { row: 5, col: 2 },
  { row: 5, col: 4 },
  // Rows 4 → 2: sides bottom-to-top; each step is one full `10001` (left then right).
  { row: 4, col: 1 },
  { row: 4, col: 5 },
  { row: 3, col: 1 },
  { row: 3, col: 5 },
  { row: 2, col: 1 },
  { row: 2, col: 5 },
  // Row 1 top: same center-out as bottom
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 4 },
];

/** Bottom row only (1–3 dots): same center-out as the first three glass slots. */
function bottomRowGridCells(count: number): GlassFillGridCell[] {
  if (count === 1) {
    return [{ row: 5, col: 3 }];
  }
  if (count === 2) {
    return [
      { row: 5, col: 2 },
      { row: 5, col: 4 },
    ];
  }
  return [
    { row: 5, col: 3 },
    { row: 5, col: 2 },
    { row: 5, col: 4 },
  ];
}

/** Solid marker — rings looked hollow on range highlights; use tiny shadow for separation only. */
function TimelineDot({ color }: { color: string }) {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.22)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.28)]"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

/** Up to this many dots: only the bottom row of the frame (1–3). Beyond that → glass fill on full perimeter. */
const MAX_BOTTOM_ROW_ONLY = 3;
const MAX_VISIBLE_DOTS = 12;

/** n = number of dots to show (1–12). n ≤ 3 → only bottom row; n ≥ 4 → full glass prefix. */
function glassFillGridCellsForDotCount(n: number): GlassFillGridCell[] {
  if (n <= MAX_BOTTOM_ROW_ONLY) {
    return bottomRowGridCells(n);
  }
  return GLASS_FILL_PERIMETER_SLOTS.slice(0, n);
}

export interface DatePickerTimelineContext {
  locations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  unassigned: Activity[];
}

type TimelineEntry = {
  kind: "route" | "activity";
  label: string;
  color: string;
};

function getTimelineEntriesForDay(day: Date, ctx: DatePickerTimelineContext): TimelineEntry[] {
  const out: TimelineEntry[] = [];

  ctx.locations.forEach((loc, i) => {
    if (!loc.arrival_date) {
      return;
    }
    const start = startOfDay(new Date(loc.arrival_date));
    const end = startOfDay(new Date(loc.departure_date || loc.arrival_date));
    const d = startOfDay(day);
    if (isWithinInterval(d, { start, end })) {
      out.push({
        kind: "route",
        label: loc.location_name,
        color: ROUTE_DOT_COLORS[i % ROUTE_DOT_COLORS.length],
      });
    }
  });

  const pushActivity = (act: Activity) => {
    if (!act.start_time) {
      return;
    }
    if (isSameDay(new Date(act.start_time), day)) {
      const hex = act.color;
      out.push({
        kind: "activity",
        label: act.title,
        color:
          hex && /^#[0-9A-Fa-f]{6}$/.test(hex)
            ? hex
            : "#94a3b8",
      });
    }
  };

  for (const acts of Object.values(ctx.activitiesByLocation)) {
    for (const act of acts) {
      pushActivity(act);
    }
  }
  for (const act of ctx.unassigned) {
    pushActivity(act);
  }

  return out;
}

function TimelineDayButton({
  context,
  ...props
}: React.ComponentProps<typeof CalendarDayButton> & {
  context: DatePickerTimelineContext;
}) {
  const { t } = useTranslation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const entries = useMemo(
    () => getTimelineEntriesForDay(props.day.date, context),
    [context, props.day.date]
  );

  const showDetailToast = useCallback(() => {
    const dayLabel = format(props.day.date, "EEEE, MMM d");
    toast.custom(
      () => (
        <div className="w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-popover p-4 shadow-lg animate-in zoom-in-95 fade-in duration-200">
          <p className="text-sm font-semibold text-foreground mb-2">{dayLabel}</p>
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("date_picker.timeline_empty_day")}
            </p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {entries.map((e, idx) => (
                <li key={`${e.kind}-${e.label}-${idx}`} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: e.color }}
                    aria-hidden
                  />
                  <span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {e.kind === "route"
                        ? t("date_picker.timeline_route")
                        : t("date_picker.timeline_activity")}
                    </span>
                    <span className="block text-foreground leading-snug">{e.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
      { duration: 6000 }
    );
  }, [entries, props.day.date, t]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    props.onPointerDown?.(e);
    firedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      showDetailToast();
    }, 550);
  };

  const endLongPress = (e: React.PointerEvent<HTMLButtonElement>) => {
    props.onPointerUp?.(e);
    clearTimer();
  };

  const visibleDots = entries.slice(0, MAX_VISIBLE_DOTS);
  const overflow = entries.length - visibleDots.length;
  const n = visibleDots.length;
  const useBottomRowOnly = n <= MAX_BOTTOM_ROW_ONLY;

  const gridCells = glassFillGridCellsForDotCount(n);

  return (
    <div className="relative h-full w-full">
      <CalendarDayButton
        {...props}
        onPointerDown={onPointerDown}
        onPointerUp={endLongPress}
        onPointerLeave={endLongPress}
        onPointerCancel={endLongPress}
        onContextMenu={(e) => {
          if (firedRef.current) {
            e.preventDefault();
          }
          props.onContextMenu?.(e);
        }}
      />
      {visibleDots.length > 0 && (
        <>
          {useBottomRowOnly ? (
            <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
              {overflow > 0 && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[8px] font-bold leading-none text-muted-foreground">
                  +{overflow}
                </span>
              )}
              {/* Same bottom inset for 1–3 dots (grid used to vertically center row-5 vs flex flush-bottom). */}
              <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
                {n === 3 ? (
                  <>
                    <TimelineDot color={visibleDots[1].color} />
                    <TimelineDot color={visibleDots[0].color} />
                    <TimelineDot color={visibleDots[2].color} />
                  </>
                ) : (
                  visibleDots.map((e, i) => (
                    <TimelineDot key={`glass-dot-${i}`} color={e.color} />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div
              className="pointer-events-none absolute inset-0 z-[1] grid grid-cols-5 grid-rows-5 p-px"
              aria-hidden
            >
              {visibleDots.map((e, i) => {
                const cell = gridCells[i];
                if (!cell) {
                  return null;
                }
                return (
                  <span
                    key={`glass-dot-${i}`}
                    className="flex size-full min-h-0 min-w-0 items-center justify-center"
                    style={{ gridRow: cell.row, gridColumn: cell.col }}
                  >
                    <TimelineDot color={e.color} />
                  </span>
                );
              })}
              {overflow > 0 && (
                <span className="col-start-5 row-start-1 flex items-start justify-end pr-0.5 pt-0.5 text-[8px] font-bold leading-none text-muted-foreground">
                  +{overflow}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface DatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (dateRange: DateRange | undefined) => void;
  selectedDateRange?: DateRange;
  minDate?: Date;
  maxDate?: Date;
  modifiers?: Record<string, Matcher | Matcher[]>;
  /** When set, days show dots for route stops / activities; long-press a day for details. */
  timelineContext?: DatePickerTimelineContext;
}

export function DatePicker({
  open,
  onClose,
  onSelect,
  selectedDateRange,
  minDate,
  maxDate,
  modifiers,
  timelineContext,
}: DatePickerProps) {
  const { t } = useTranslation();
  const [localRange, setLocalRange] = useState<DateRange | undefined>(selectedDateRange);

  useEffect(() => {
    if (open) {
      setLocalRange(selectedDateRange);
    }
  }, [open, selectedDateRange]);

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setLocalRange(dateRange);
  };

  const handleDone = () => {
    if (localRange?.from && localRange?.to) {
      onSelect(localRange);
    }
    onClose();
  };

  const canSubmit = !!(localRange?.from && localRange?.to);

  const tripWindowText =
    minDate && maxDate
      ? `${format(minDate, "MMM d")} – ${format(maxDate, "MMM d")}`
      : null;

  const numberOfMonths = useMemo(() => {
    if (!minDate || !maxDate) {
      return 2;
    }
    return isSameMonth(startOfDay(minDate), startOfDay(maxDate)) ? 1 : 2;
  }, [minDate, maxDate]);

  const calendarModifiers = useMemo(() => {
    const base = { ...(modifiers ?? {}) };
    if (minDate && maxDate) {
      base.tripWindow = { from: startOfDay(minDate), to: startOfDay(maxDate) };
    }
    return base;
  }, [modifiers, minDate, maxDate]);

  const defaultMonth = useMemo(() => {
    if (localRange?.from) {
      return localRange.from;
    }
    if (selectedDateRange?.from) {
      return selectedDateRange.from;
    }
    if (minDate) {
      return minDate;
    }
    return new Date();
  }, [localRange?.from, selectedDateRange?.from, minDate]);

  const DayBtn = timelineContext
    ? (btnProps: React.ComponentProps<typeof CalendarDayButton>) => (
        <TimelineDayButton {...btnProps} context={timelineContext} />
      )
    : CalendarDayButton;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="min-h-0">
        <DrawerHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <Button variant="ghost">{t("date_picker.cancel")}</Button>
            </DrawerClose>
            <DrawerTitle className="mb-0">{t("date_picker.title")}</DrawerTitle>
            <Button
              variant="ghost"
              onClick={handleDone}
              disabled={!canSubmit}
            >
              {t("date_picker.done")}
            </Button>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 [-webkit-overflow-scrolling:touch]">
          <Calendar
            mode="range"
            defaultMonth={defaultMonth}
            selected={localRange}
            onSelect={handleDateSelect}
            fromDate={minDate}
            toDate={maxDate}
            disabled={
              minDate && maxDate ? [{ before: minDate }, { after: maxDate }] : undefined
            }
            modifiers={calendarModifiers}
            numberOfMonths={numberOfMonths}
            className="w-full"
            components={{
              DayButton: DayBtn,
            }}
          />
          {(tripWindowText || !!(modifiers as Record<string, unknown>)?.busy || timelineContext) && (
            <div className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
              {tripWindowText && (
                <div>
                  <span>{t("date_picker.trip_window")}:</span>{" "}
                  <span className="font-medium text-foreground">{tripWindowText}</span>
                </div>
              )}
              {!!(modifiers as Record<string, unknown>)?.busy && (
                <div>
                  <span>{t("date_picker.tip_label")}:</span>{" "}
                  <span className="text-foreground">
                    {t("date_picker.other_stops_shaded")}
                  </span>
                </div>
              )}
              {timelineContext && (
                <div className="text-foreground">
                  {t("date_picker.hold_for_details")}
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
