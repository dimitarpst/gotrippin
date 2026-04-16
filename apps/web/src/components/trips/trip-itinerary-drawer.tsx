"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlertCircle, ArrowDownUp, ChevronRight, Plus, X } from "lucide-react";
import type { Activity, Trip, TripLocation, TripLocationWeather } from "@gotrippin/core";
import { formatTripDate } from "@gotrippin/core";
import { tripDisplayTitle } from "@/lib/trip-display";

import WeatherWidget from "@/components/trips/weather-widget";
import { WeatherUnavailableIndicator } from "@/components/trips/weather-unavailable-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import * as Sortable from "@/components/ui/sortable";
import { useTripWeather } from "@/hooks/useWeather";
import { reorderLocations as apiReorderLocations } from "@/lib/api/trip-locations";
import { getStablePaletteColorForLocationId, isSolidRouteColor } from "@/lib/route-colors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function sortLocationsByOrder(locations: TripLocation[]): TripLocation[] {
  return [...locations].sort((a, b) => a.order_index - b.order_index);
}

function getLocationDateCompact(location: TripLocation) {
  const arrival = location.arrival_date ? new Date(location.arrival_date) : null;
  const departure = location.departure_date ? new Date(location.departure_date) : null;
  const muted = "text-xs tabular-nums text-muted-foreground sm:text-sm";
  if (arrival && departure) {
    return (
      <span className={muted}>
        {format(arrival, "MMM d")}
        <span className="mx-1 text-muted-foreground/70">→</span>
        {format(departure, "MMM d")}
      </span>
    );
  }
  if (arrival) {
    return <span className={muted}>{format(arrival, "MMM d")}</span>;
  }
  if (departure) {
    return <span className={muted}>{format(departure, "MMM d")}</span>;
  }
  return null;
}

function renderLocationWeather(
  location: TripLocation,
  trip: Trip,
  weatherByLocation: Record<string, TripLocationWeather>,
  weatherLoading: boolean,
  t: (key: string, options?: Record<string, string | number>) => string,
) {
  const entry = weatherByLocation[location.id];
  const weather = entry?.weather;

  if (weatherLoading) {
    return (
      <span className="text-xs text-muted-foreground">{t("weather.loading", { defaultValue: "Loading weather..." })}</span>
    );
  }

  if (weather?.current) {
    return (
      <WeatherWidget
        variant="inline"
        minimal
        weather={{
          ...weather,
          location: location.location_name || tripDisplayTitle(trip) || trip.destination || weather.location,
        }}
      />
    );
  }

  if (entry?.error) {
    return <WeatherUnavailableIndicator />;
  }

  return null;
}

export interface TripItineraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  shareCode: string;
  locations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  onAfterReorder?: () => void;
  /** When false, hide reorder and other write affordances (viewer role). */
  canEdit?: boolean;
}

export function TripItineraryDrawer({
  open,
  onOpenChange,
  trip,
  shareCode,
  locations: locationsProp,
  activitiesByLocation,
  onAfterReorder,
  canEdit = true,
}: TripItineraryDrawerProps) {
  const { t } = useTranslation();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedLocations, setOrderedLocations] = useState<TripLocation[]>(() =>
    sortLocationsByOrder(locationsProp),
  );
  const [savingOrder, setSavingOrder] = useState(false);

  const { byLocation: weatherByLocation, loading: weatherLoading, error: weatherError } = useTripWeather(
    trip.id,
    5,
  );

  useEffect(() => {
    setOrderedLocations(sortLocationsByOrder(locationsProp));
  }, [locationsProp]);

  useEffect(() => {
    if (!open) {
      setReorderMode(false);
    }
  }, [open]);

  useEffect(() => {
    if (!canEdit) {
      setReorderMode(false);
    }
  }, [canEdit]);

  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tripTitle = tripDisplayTitle(trip) ?? t("trips.untitled_trip");
  const monthLabel = useMemo(() => {
    if (!trip.start_date) return null;
    try {
      return format(new Date(trip.start_date), "MMMM yyyy");
    } catch {
      return null;
    }
  }, [trip.start_date]);

  const startDate = trip.start_date ? formatTripDate(trip.start_date) : "—";
  const endDate = trip.end_date ? formatTripDate(trip.end_date) : "—";
  const hasRoute = orderedLocations.length > 0;

  const handleReorderMove = useCallback(
    async ({
      activeIndex,
      overIndex,
    }: {
      activeIndex: number;
      overIndex: number;
    }) => {
      if (activeIndex === overIndex) return;
      const next = [...orderedLocations];
      const [moved] = next.splice(activeIndex, 1);
      next.splice(overIndex, 0, moved);
      const locationIds = next.map((l) => l.id);
      setOrderedLocations(next);
      setSavingOrder(true);
      try {
        await apiReorderLocations(trip.id, { location_ids: locationIds });
        onAfterReorder?.();
      } catch (err) {
        console.error("TripItineraryDrawer: reorder failed", err);
        toast.error(t("trip_overview.route_reorder_failed", { defaultValue: "Failed to reorder stops" }));
        setOrderedLocations(sortLocationsByOrder(locationsProp));
      } finally {
        setSavingOrder(false);
      }
    },
    [orderedLocations, trip.id, locationsProp, onAfterReorder, t],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal handleOnly dismissible>
      <DrawerContent
        overlayClassName="z-[100]"
        className={cn(
          "!z-[200] !mt-0 mb-0 max-w-5xl border border-border bg-background text-foreground shadow-xl",
          "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-0.5rem))] flex min-h-0 flex-col overflow-hidden rounded-t-[1.25rem] px-0",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-3 pb-2 pt-1 sm:px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2">
                {monthLabel ? (
                  <p className="text-xs font-medium text-muted-foreground">{monthLabel}</p>
                ) : null}
                <h2 className="text-balance text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
                  {tripTitle}
                </h2>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground sm:text-sm">
                  {startDate}
                  <span className="mx-1 text-muted-foreground/70">→</span>
                  {endDate}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 size-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onOpenChange(false)}
                aria-label={t("common.close", { defaultValue: "Close" })}
              >
                <X className="size-5" />
              </Button>
            </div>

            {canEdit && hasRoute && orderedLocations.length >= 2 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("trip_overview.route_title")}
                </span>
                <button
                  type="button"
                  onClick={() => setReorderMode((v) => !v)}
                  aria-pressed={reorderMode}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-semibold transition-colors",
                    reorderMode
                      ? "border-[#ff7670] bg-[#ff7670]/10 text-[#ff7670]"
                      : "border-border bg-muted/50 text-foreground hover:bg-muted",
                  )}
                >
                  <ArrowDownUp className="size-4 shrink-0 opacity-90" aria-hidden />
                  {reorderMode
                    ? t("trip_overview.route_reorder_done_short", { defaultValue: "Done" })
                    : t("trip_overview.route_reorder_action", { defaultValue: "Reorder" })}
                </button>
              </div>
            ) : null}

            {canEdit && reorderMode && orderedLocations.length >= 2 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("trip_overview.route_reorder_hint", {
                  defaultValue: "Drag a card by its edges to change the order of stops.",
                })}
              </p>
            ) : null}
          </div>

          {weatherError ? (
            <div className="px-3 sm:px-4">
              <Alert variant="destructive" className="p-3">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">{weatherError}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 [touch-action:pan-y]"
            data-vaul-no-drag=""
          >
            {!hasRoute ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-3 py-3 dark:bg-white/[0.02]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-white/10">
                  <Plus className="size-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t("trip_overview.route_empty_title")}</p>
                  <p className="text-xs text-muted-foreground">{t("trip_overview.route_empty")}</p>
                </div>
              </div>
            ) : canEdit && reorderMode ? (
              <Sortable.Root
                sensors={reorderSensors}
                value={orderedLocations}
                getItemValue={(item) => item.id}
                orientation="vertical"
                onMove={handleReorderMove}
              >
                <Sortable.Content className="space-y-2 pb-4">
                  {orderedLocations.map((location, index) => (
                    <Sortable.Item
                      key={location.id}
                      value={location.id}
                      disabled={savingOrder}
                      className="relative rounded-2xl outline-none data-dragging:z-[2] data-dragging:shadow-xl"
                    >
                      <div className="relative z-0">
                        <ItineraryStopBlock
                          location={location}
                          index={index}
                          isLast={index === orderedLocations.length - 1}
                          trip={trip}
                          shareCode={shareCode}
                          activitiesByLocation={activitiesByLocation}
                          weatherByLocation={weatherByLocation}
                          weatherLoading={weatherLoading}
                          reorderMode
                        />
                      </div>
                      <Sortable.ItemHandle
                        className="absolute inset-0 z-[1] cursor-grab touch-none rounded-2xl border-0 bg-transparent p-0 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-[#ff7670]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
                        aria-label={t("trip_overview.route_drag_row", {
                          name: location.location_name?.trim() || t("trips.untitled_trip"),
                        })}
                      />
                    </Sortable.Item>
                  ))}
                </Sortable.Content>
              </Sortable.Root>
            ) : (
              <div className="space-y-0 pb-4">
                {orderedLocations.map((location, index) => (
                  <ItineraryStopBlock
                    key={location.id}
                    location={location}
                    index={index}
                    isLast={index === orderedLocations.length - 1}
                    trip={trip}
                    shareCode={shareCode}
                    activitiesByLocation={activitiesByLocation}
                    weatherByLocation={weatherByLocation}
                    weatherLoading={weatherLoading}
                    reorderMode={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ItineraryStopBlock({
  location,
  index,
  isLast,
  trip,
  shareCode,
  activitiesByLocation,
  weatherByLocation,
  weatherLoading,
  reorderMode,
}: {
  location: TripLocation;
  index: number;
  isLast: boolean;
  trip: Trip;
  shareCode: string;
  activitiesByLocation: Record<string, Activity[]>;
  weatherByLocation: Record<string, TripLocationWeather>;
  weatherLoading: boolean;
  reorderMode: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const acts = activitiesByLocation[location.id] || [];
  const dateCompact = getLocationDateCompact(location);
  const stopDotColor =
    location.marker_color != null && isSolidRouteColor(location.marker_color)
      ? location.marker_color
      : getStablePaletteColorForLocationId(location.id);

  const headerInner = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-mono text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <h3 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
          {location.location_name || t("trips.untitled_trip")}
        </h3>
        {!reorderMode ? (
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground opacity-70 sm:hidden"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
        {renderLocationWeather(location, trip, weatherByLocation, weatherLoading, t)}
        {dateCompact}
        {!reorderMode ? (
          <ChevronRight className="hidden size-5 text-muted-foreground opacity-60 sm:block" aria-hidden />
        ) : null}
      </div>
    </div>
  );

  const showRailConnector = !reorderMode && !isLast;

  return (
    <section
      className={cn(
        "flex gap-3 sm:gap-4",
        reorderMode
          ? "select-none rounded-2xl border border-dashed border-border bg-muted/30 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(128,128,128,0.08)] dark:border-white/35 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : index > 0 && "mt-8 border-t border-border pt-8 sm:mt-10 sm:pt-10",
      )}
    >
      <div className="flex w-3 shrink-0 flex-col items-center self-stretch sm:w-3.5">
        <div
          className="z-[1] mt-1.5 size-3 shrink-0 rounded-full ring-[3px] ring-background sm:size-3.5 sm:ring-4"
          style={{ backgroundColor: stopDotColor }}
          aria-hidden
        />
        {showRailConnector ? (
          <div
            className="mt-3 min-h-[3rem] w-px flex-1 bg-gradient-to-b from-border to-muted/40 dark:from-white/20 dark:to-white/5"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        {reorderMode ? (
          <div className="rounded-lg">{headerInner}</div>
        ) : (
          <button
            type="button"
            className="group w-full rounded-lg text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#ff7670]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => router.push(`/trips/${shareCode}/timeline/${location.id}`)}
          >
            {headerInner}
          </button>
        )}

        <div className="mt-3 w-full sm:mt-4">
          {acts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("trip_overview.no_activities_stop")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {acts.map((act) => (
                <li key={act.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 text-left font-normal text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:px-4 sm:py-3.5"
                    onClick={() => router.push(`/trips/${shareCode}/activity/${act.id}/edit`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium">{act.title}</p>
                      {act.start_time ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {new Date(act.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      ) : null}
                    </div>
                    {act.type ? (
                      <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {act.type.replace("_", " ")}
                      </span>
                    ) : null}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
