import type { Trip, TripLocation } from '../schemas/trip';

/** @see apps/web/src/lib/trip-date-picker-bounds.ts (web must stay in sync; bundled for SSR/Next) */

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
  if (iso == null || iso.trim() === '') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return localStartOfDay(d);
}

/**
 * Bounds for route / stop date pickers: trip window when set, otherwise min/max
 * calendar days from stop arrival/departure, otherwise today through two years ahead.
 */
export function getTripDatePickerBounds(
  trip: Pick<Trip, 'start_date' | 'end_date'>,
  locations: Array<Pick<TripLocation, 'arrival_date' | 'departure_date'>>,
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
