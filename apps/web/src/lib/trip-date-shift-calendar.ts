import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

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
