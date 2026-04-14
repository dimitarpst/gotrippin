"use client";

import { useMemo, useState } from "react";
import { Star, Clock3, Phone, MapPin } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { AiPlaceSuggestion } from "@/lib/api/ai";

interface AiPlaceSuggestionsProps {
  places: AiPlaceSuggestion[];
}

function formatRating(rating?: number | null, count?: number | null): string | null {
  if (rating == null) return null;
  if (count == null) return `${rating.toFixed(1)}★`;
  return `${rating.toFixed(1)}★ (${count.toLocaleString()})`;
}

export default function AiPlaceSuggestions({ places }: AiPlaceSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedPlace = useMemo(
    () => (selectedIndex == null ? null : places[selectedIndex] ?? null),
    [places, selectedIndex],
  );

  if (!places.length) return null;

  return (
    <>
      <div className="space-y-2 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Suggested places</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {places.map((place, index) => (
            <button
              key={`${place.place_id ?? place.name}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className="w-64 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/35 text-left backdrop-blur-xl transition hover:border-white/30 hover:bg-black/45"
            >
              {place.photo_url ? (
                <img src={place.photo_url} alt={place.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-3xl font-semibold text-white/60">
                  {place.name.charAt(0)}
                </div>
              )}
              <div className="space-y-1.5 p-3">
                {place.visit_time ? (
                  <p className="text-xs font-medium text-white/60">{place.visit_time}</p>
                ) : null}
                <p className="line-clamp-1 text-sm font-semibold text-white">{place.name}</p>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  {place.rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                      {formatRating(place.rating, place.rating_count)}
                    </span>
                  ) : null}
                  {place.place_type ? <span>· {place.place_type}</span> : null}
                </div>
                {place.ai_note ? (
                  <p className="line-clamp-2 rounded-xl bg-white/5 px-2.5 py-2 text-xs leading-relaxed text-white/80">
                    Notes from goAI: {place.ai_note}
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Drawer open={selectedPlace != null} onOpenChange={(open) => (!open ? setSelectedIndex(null) : null)}>
        <DrawerContent className="border-white/10 bg-zinc-950 text-white">
          {selectedPlace ? (
            <div className="mx-auto w-full max-w-xl space-y-3 p-4 pb-6">
              {selectedPlace.photo_url ? (
                <img
                  src={selectedPlace.photo_url}
                  alt={selectedPlace.name}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : null}
              <div className="space-y-1">
                {selectedPlace.visit_time ? (
                  <p className="text-sm text-white/60">{selectedPlace.visit_time}</p>
                ) : null}
                <h3 className="text-xl font-semibold">{selectedPlace.name}</h3>
                {selectedPlace.address ? (
                  <p className="text-sm text-white/70">{selectedPlace.address}</p>
                ) : null}
              </div>
              <div className="space-y-1 text-sm text-white/80">
                {selectedPlace.rating != null ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-current text-amber-300" />
                    {formatRating(selectedPlace.rating, selectedPlace.rating_count)}
                  </p>
                ) : null}
                {selectedPlace.phone_number ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-white/70" />
                    {selectedPlace.phone_number}
                  </p>
                ) : null}
                {selectedPlace.place_type ? (
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-white/70" />
                    {selectedPlace.place_type}
                  </p>
                ) : null}
                {selectedPlace.weekday_hours && selectedPlace.weekday_hours.length ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-white/70" />
                    {selectedPlace.weekday_hours[0]}
                  </p>
                ) : null}
              </div>
              {selectedPlace.ai_note ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Notes from goAI</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/90">{selectedPlace.ai_note}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
