import type { Trip, TripLocation } from "@gotrippin/core";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * Shown in place-details header when `arrival_date` is not start-of-day local (i.e. has a visit time).
 */
export function visitTimeLabelFromArrivalIso(arrivalDateIso: string | null | undefined): string | null {
  if (arrivalDateIso == null || arrivalDateIso.trim() === "") return null;
  const d = new Date(arrivalDateIso);
  if (Number.isNaN(d.getTime())) return null;
  const sod = startOfDay(d);
  if (d.getTime() === sod.getTime()) return null;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function parseTripDay(iso: string | null | undefined): Date | null {
  if (iso == null || iso.trim() === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return startOfDay(d);
}

/**
 * When a stop has no `arrival_date`, spread calendar days across the route within the trip window
 * so list rows and drawers show a sensible default (trip dates required).
 */
export function getSuggestedStopDateRange(
  stopIndex: number,
  trip: Pick<Trip, "start_date" | "end_date">,
  routeLength: number,
): DateRange | undefined {
  const startDay = parseTripDay(trip.start_date ?? undefined);
  const endDay = parseTripDay(trip.end_date ?? undefined);
  if (!startDay) return undefined;
  const lastDay = endDay ?? startDay;
  const span = Math.max(0, differenceInCalendarDays(lastDay, startDay));
  const n = Math.max(1, routeLength);
  if (n === 1) {
    return { from: startDay, to: lastDay };
  }
  const t = stopIndex / (n - 1);
  const offset = Math.round(t * span);
  const day = addDays(startDay, Math.min(offset, span));
  return { from: day, to: day };
}

/**
 * Saved stop dates, or suggested dates from the trip window when unset.
 */
export function getEffectiveStopDateRange(
  location: TripLocation,
  stopIndex: number,
  orderedLocations: TripLocation[],
  trip: Pick<Trip, "start_date" | "end_date">,
): DateRange | undefined {
  if (location.arrival_date) {
    return {
      from: new Date(location.arrival_date),
      to: location.departure_date ? new Date(location.departure_date) : undefined,
    };
  }
  return getSuggestedStopDateRange(stopIndex, trip, orderedLocations.length);
}
