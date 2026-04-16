import type { Trip, TripLocation } from "@gotrippin/core";

/**
 * Bounds for route / stop date pickers.
 * Mirrors `packages/core/src/utils/trip-date-picker-bounds.ts` — keep in sync.
 * Implemented here so the web bundle does not rely on `@gotrippin/core` CJS named-export
 * resolution (avoids runtime "is not a function" when `dist` is stale in dev).
 */
export type TripDatePickerBounds = {
  minDate: Date | undefined;
  maxDate: Date | undefined;
};

function localStartOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localEndOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function parseDay(iso: string | null | undefined): Date | null {
  if (iso == null || iso.trim() === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return localStartOfDay(d);
}

export function getTripDatePickerBounds(
  trip: Pick<Trip, "start_date" | "end_date">,
  locations: Array<Pick<TripLocation, "arrival_date" | "departure_date">>,
): TripDatePickerBounds {
  const startRaw = trip.start_date?.trim();
  const endRaw = trip.end_date?.trim();
  if (startRaw || endRaw) {
    const minDate =
      startRaw && startRaw.length > 0
        ? (() => {
            const start = new Date(startRaw);
            return Number.isNaN(start.getTime()) ? undefined : start;
          })()
        : undefined;
    const maxDate =
      endRaw && endRaw.length > 0
        ? (() => {
            const end = new Date(endRaw);
            return Number.isNaN(end.getTime()) ? undefined : end;
          })()
        : undefined;
    return { minDate, maxDate };
  }

  const dayStamps: number[] = [];
  for (const loc of locations) {
    const a = parseDay(loc.arrival_date ?? undefined);
    const b = parseDay(loc.departure_date ?? undefined);
    if (a) dayStamps.push(a.getTime());
    if (b) dayStamps.push(b.getTime());
  }

  if (dayStamps.length > 0) {
    const minT = Math.min(...dayStamps);
    const maxT = Math.max(...dayStamps);
    return {
      minDate: localStartOfDay(new Date(minT)),
      maxDate: localEndOfDay(new Date(maxT)),
    };
  }

  const today = localStartOfDay(new Date());
  const far = new Date(today);
  far.setFullYear(far.getFullYear() + 2);
  return { minDate: today, maxDate: far };
}
