import type { Activity, TripLocation, UpdateActivity, UpdateTripLocation } from "@gotrippin/core";
import { shiftIsoByCalendarDays } from "@/lib/trip-date-shift-calendar";
import { updateActivity } from "@/lib/api/activities";
import { updateLocation } from "@/lib/api/trip-locations";

/**
 * Shifts all route stop dates and activity datetimes by {@link calendarDayDelta} calendar days.
 * Call after the trip's start/end have been saved when the trip start moved (calendar days).
 */
export async function shiftTripRelatedDatesByCalendarDays(
  tripId: string,
  calendarDayDelta: number,
  locations: TripLocation[],
  activitiesByLocation: Record<string, Activity[]>,
  unassigned: Activity[]
): Promise<void> {
  if (calendarDayDelta === 0) {
    return;
  }

  const tasks: Promise<unknown>[] = [];

  for (const loc of locations) {
    const payload: UpdateTripLocation = {};
    const nextArrival = shiftIsoByCalendarDays(loc.arrival_date ?? null, calendarDayDelta);
    const nextDeparture = shiftIsoByCalendarDays(loc.departure_date ?? null, calendarDayDelta);
    if (nextArrival !== null) {
      payload.arrival_date = nextArrival;
    }
    if (nextDeparture !== null) {
      payload.departure_date = nextDeparture;
    }
    if (Object.keys(payload).length > 0) {
      tasks.push(updateLocation(tripId, loc.id, payload));
    }
  }

  const pushActivity = (act: Activity) => {
    const payload: UpdateActivity = {};
    const nextStart = shiftIsoByCalendarDays(act.start_time ?? null, calendarDayDelta);
    const nextEnd = shiftIsoByCalendarDays(act.end_time ?? null, calendarDayDelta);
    if (nextStart !== null) {
      payload.start_time = nextStart;
    }
    if (nextEnd !== null) {
      payload.end_time = nextEnd;
    }
    if (Object.keys(payload).length > 0) {
      tasks.push(updateActivity(tripId, act.id, payload));
    }
  };

  for (const acts of Object.values(activitiesByLocation)) {
    for (const act of acts) {
      pushActivity(act);
    }
  }
  for (const act of unassigned) {
    pushActivity(act);
  }

  const results = await Promise.allSettled(tasks);
  const rejected = results.filter((r) => r.status === "rejected");
  if (rejected.length > 0) {
    const first = rejected[0];
    const reason =
      first.status === "rejected" && first.reason instanceof Error
        ? first.reason.message
        : "Some updates failed";
    console.error("shiftTripRelatedDatesByCalendarDays: partial failure", rejected);
    throw new Error(reason);
  }
}
