import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { Activity, TripLocation } from "@gotrippin/core";

/**
 * Calendar-day delta between the previous trip start (ISO) and the newly picked start.
 * Uses local calendar dates so UTC-stored `start_date` and picker midnights stay consistent.
 */
export function computeTripStartCalendarDayDelta(
  previousStartIso: string | null | undefined,
  nextStart: Date
): number | null {
  if (!previousStartIso) {
    return null;
  }
  const prev = new Date(previousStartIso);
  if (Number.isNaN(prev.getTime())) {
    return null;
  }
  return differenceInCalendarDays(startOfDay(nextStart), startOfDay(prev));
}

/**
 * Shifts an ISO timestamp by a whole number of calendar days (handles DST via date-fns).
 */
export function shiftIsoByCalendarDays(
  iso: string | null | undefined,
  deltaDays: number
): string | null {
  if (!iso) {
    return null;
  }
  if (deltaDays === 0) {
    return new Date(iso).toISOString();
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return addDays(d, deltaDays).toISOString();
}

/** In-memory copy of a stop with arrival/departure shifted (same rules as persist shift). */
export function shiftTripLocationByCalendarDays(
  loc: TripLocation,
  deltaDays: number
): TripLocation {
  if (deltaDays === 0) {
    return loc;
  }
  return {
    ...loc,
    arrival_date: loc.arrival_date
      ? shiftIsoByCalendarDays(loc.arrival_date, deltaDays) ?? loc.arrival_date
      : loc.arrival_date,
    departure_date: loc.departure_date
      ? shiftIsoByCalendarDays(loc.departure_date, deltaDays) ?? loc.departure_date
      : loc.departure_date,
  };
}

/** In-memory copy of an activity with start/end shifted. */
export function shiftActivityByCalendarDays(
  act: Activity,
  deltaDays: number
): Activity {
  if (deltaDays === 0) {
    return act;
  }
  return {
    ...act,
    start_time: act.start_time
      ? shiftIsoByCalendarDays(act.start_time, deltaDays) ?? act.start_time
      : act.start_time,
    end_time: act.end_time
      ? shiftIsoByCalendarDays(act.end_time, deltaDays) ?? act.end_time
      : act.end_time,
  };
}

export function shiftActivitiesByLocationByCalendarDays(
  byLocation: Record<string, Activity[]>,
  deltaDays: number
): Record<string, Activity[]> {
  if (deltaDays === 0) {
    return byLocation;
  }
  const out: Record<string, Activity[]> = {};
  for (const [id, list] of Object.entries(byLocation)) {
    out[id] = list.map((a) => shiftActivityByCalendarDays(a, deltaDays));
  }
  return out;
}
