"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import type { Activity, TripLocation } from "@gotrippin/core";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { updateLocation } from "@/lib/api/trip-locations";
import { updateActivity } from "@/lib/api/activities";
import { suggestedLocationRange, suggestedActivityDay } from "@/lib/trip-schedule-bounds";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

function mergeCalendarDayWithTimeFromIso(dayPicked: Date, originalIso: string): string {
  const old = new Date(originalIso);
  const next = new Date(dayPicked);
  next.setHours(old.getHours(), old.getMinutes(), old.getSeconds(), old.getMilliseconds());
  return next.toISOString();
}

export interface TripScheduleRepairDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripStart: Date;
  tripEnd: Date;
  /** Stops that need new dates. */
  locations: TripLocation[];
  /** Activities whose timed start falls outside the trip window. */
  activities: Activity[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onRepaired: () => void;
}

export function TripScheduleRepairDrawer({
  open,
  onOpenChange,
  tripId,
  tripStart,
  tripEnd,
  locations,
  activities,
  saving,
  setSaving,
  onRepaired,
}: TripScheduleRepairDrawerProps) {
  const { t } = useTranslation();

  const [locationRanges, setLocationRanges] = useState<Record<string, DateRange | undefined>>({});
  const [activityDays, setActivityDays] = useState<Record<string, Date | undefined>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextLoc: Record<string, DateRange | undefined> = {};
    for (const loc of locations) {
      const r = suggestedLocationRange(loc, tripStart, tripEnd);
      nextLoc[loc.id] = { from: r.from, to: r.to };
    }
    setLocationRanges(nextLoc);

    const nextAct: Record<string, Date | undefined> = {};
    for (const act of activities) {
      nextAct[act.id] = suggestedActivityDay(act, tripStart, tripEnd);
    }
    setActivityDays(nextAct);
  }, [open, locations, activities, tripStart, tripEnd]);

  const canSave = useMemo(() => {
    for (const loc of locations) {
      const r = locationRanges[loc.id];
      if (!r?.from || !r?.to) {
        return false;
      }
    }
    for (const act of activities) {
      if (!activityDays[act.id]) {
        return false;
      }
    }
    return true;
  }, [locations, activities, locationRanges, activityDays]);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    try {
      for (const loc of locations) {
        const r = locationRanges[loc.id];
        if (!r?.from || !r?.to) {
          continue;
        }
        await updateLocation(tripId, loc.id, {
          arrival_date: r.from.toISOString(),
          departure_date: r.to.toISOString(),
        });
      }

      for (const act of activities) {
        const day = activityDays[act.id];
        if (!day) {
          continue;
        }
        const baseIso = act.start_time ?? act.end_time;
        if (baseIso) {
          const newStart = mergeCalendarDayWithTimeFromIso(day, baseIso);
          let newEnd: string | undefined;
          if (act.end_time) {
            newEnd = mergeCalendarDayWithTimeFromIso(day, act.end_time);
            if (new Date(newEnd) < new Date(newStart)) {
              newEnd = new Date(new Date(newStart).getTime() + 60 * 60 * 1000).toISOString();
            }
          }
          await updateActivity(tripId, act.id, {
            start_time: newStart,
            ...(newEnd ? { end_time: newEnd } : {}),
          });
          continue;
        }
        const noon = new Date(day);
        noon.setHours(12, 0, 0, 0);
        const newStart = noon.toISOString();
        const newEnd = new Date(noon.getTime() + 60 * 60 * 1000).toISOString();
        await updateActivity(tripId, act.id, {
          start_time: newStart,
          end_time: newEnd,
        });
      }

      toast.success(t("trips.schedule_repair_saved"));
      onRepaired();
    } catch (err) {
      console.error("TripScheduleRepairDrawer: save failed", err);
      toast.error(t("trips.schedule_repair_failed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    setSaving,
    tripId,
    locations,
    activities,
    locationRanges,
    activityDays,
    t,
    onRepaired,
  ]);

  const hasItems = locations.length > 0 || activities.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2">
            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="sm">
                {t("common.cancel")}
              </Button>
            </DrawerClose>
            <DrawerTitle className="text-center text-base">
              {t("trips.schedule_repair_title")}
            </DrawerTitle>
            <Button
              type="button"
              size="sm"
              disabled={!canSave || saving || !hasItems}
              onClick={() => void handleSave()}
            >
              {saving ? t("profile.saving") : t("trips.schedule_repair_save")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center px-2 pt-1">
            {t("trips.schedule_repair_description")}
          </p>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8 space-y-8">
          {locations.map((loc) => {
            const range = locationRanges[loc.id];
            return (
              <div key={loc.id} className="space-y-2">
                <p className="text-sm font-medium">
                  {t("trips.schedule_repair_stop_label", { name: loc.location_name })}
                </p>
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => {
                    setLocationRanges((prev) => ({ ...prev, [loc.id]: r }));
                  }}
                  fromDate={tripStart}
                  toDate={tripEnd}
                  disabled={[{ before: tripStart }, { after: tripEnd }]}
                  numberOfMonths={1}
                  className="w-full rounded-md border p-2"
                />
                {range?.from && range?.to && (
                  <p className="text-xs text-muted-foreground">
                    {format(range.from, "MMM d")} → {format(range.to, "MMM d")}
                  </p>
                )}
              </div>
            );
          })}

          {activities.map((act) => {
            const day = activityDays[act.id];
            return (
              <div key={act.id} className="space-y-2">
                <p className="text-sm font-medium">
                  {t("trips.schedule_repair_activity_label", { title: act.title })}
                </p>
                <Calendar
                  mode="single"
                  selected={day}
                  onSelect={(d) => {
                    setActivityDays((prev) => ({ ...prev, [act.id]: d }));
                  }}
                  fromDate={tripStart}
                  toDate={tripEnd}
                  disabled={[{ before: tripStart }, { after: tripEnd }]}
                  className="w-full rounded-md border p-2"
                />
                {day && (
                  <p className="text-xs text-muted-foreground">{format(day, "PPP")}</p>
                )}
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
