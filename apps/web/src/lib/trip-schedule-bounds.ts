import { isAfter, isBefore, startOfDay } from "date-fns";
import type { Activity, TripLocation } from "@gotrippin/core";

/**
 * Stops and timed activities whose calendar days fall outside the trip window [tripStart, tripEnd] (inclusive).
 */
export function findTripScheduleViolations(
  tripStart: Date,
  tripEnd: Date,
  locations: TripLocation[],
  activitiesByLocation: Record<string, Activity[]>,
  unassigned: Activity[]
): { locations: TripLocation[]; activities: Activity[] } {
  const ws = startOfDay(tripStart);
  const we = startOfDay(tripEnd);

  const badLocations: TripLocation[] = [];
  for (const loc of locations) {
    if (!loc.arrival_date) {
      continue;
    }
    const arr = startOfDay(new Date(loc.arrival_date));
    const dep = startOfDay(new Date(loc.departure_date || loc.arrival_date));
    if (isBefore(arr, ws) || isAfter(dep, we)) {
      badLocations.push(loc);
    }
  }

  const seen = new Set<string>();
  const badActivities: Activity[] = [];

  const consider = (act: Activity) => {
    if (seen.has(act.id)) {
      return;
    }
    if (!act.start_time) {
      return;
    }
    const d = startOfDay(new Date(act.start_time));
    if (isBefore(d, ws) || isAfter(d, we)) {
      seen.add(act.id);
      badActivities.push(act);
    }
  };

  for (const acts of Object.values(activitiesByLocation)) {
    for (const act of acts) {
      consider(act);
    }
  }
  for (const act of unassigned) {
    consider(act);
  }

  return { locations: badLocations, activities: badActivities };
}

/** Clamp a date to [lo, hi] inclusive by calendar day. */
export function clampDateToTripWindow(d: Date, tripStart: Date, tripEnd: Date): Date {
  const ws = startOfDay(tripStart);
  const we = startOfDay(tripEnd);
  const x = startOfDay(d);
  if (isBefore(x, ws)) {
    return ws;
  }
  if (isAfter(x, we)) {
    return we;
  }
  return x;
}

/** Build a valid stop range inside the trip window from possibly OOB values. */
export function suggestedLocationRange(
  loc: TripLocation,
  tripStart: Date,
  tripEnd: Date
): { from: Date; to: Date } {
  const ws = startOfDay(tripStart);
  const we = startOfDay(tripEnd);
  if (!loc.arrival_date) {
    return { from: ws, to: we };
  }
  let from = startOfDay(new Date(loc.arrival_date));
  let to = startOfDay(new Date(loc.departure_date || loc.arrival_date));
  if (isBefore(from, ws)) {
    from = ws;
  }
  if (isAfter(from, we)) {
    from = we;
  }
  if (isBefore(to, ws)) {
    to = ws;
  }
  if (isAfter(to, we)) {
    to = we;
  }
  if (isAfter(from, to)) {
    to = from;
  }
  return { from, to };
}

/** Suggested calendar day for an activity inside the trip window. */
export function suggestedActivityDay(act: Activity, tripStart: Date, tripEnd: Date): Date {
  if (!act.start_time) {
    return startOfDay(tripStart);
  }
  return clampDateToTripWindow(new Date(act.start_time), tripStart, tripEnd);
}
