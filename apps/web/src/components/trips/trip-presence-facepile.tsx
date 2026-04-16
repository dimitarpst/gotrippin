"use client";

import { User } from "lucide-react";
import type { TripPresencePeer } from "@/hooks/useTripCollaboration";

const MAX_VISIBLE = 6;

/** Hero row: other members; online = on this trip page (Realtime presence). */
export type HeroFacepileEntry = {
  userId: string;
  label: string;
  avatarUrl: string | null;
  /** Currently viewing this trip page (Supabase Realtime presence). */
  online: boolean;
};

type TripPresenceFacepileProps = {
  peers?: TripPresencePeer[];
  /** Preferred for `variant="hero"`: other members + online flag. */
  heroEntries?: HeroFacepileEntry[];
  /**
   * `hero` = under trip dates, tiny overlapping avatars, ambient (no label, no card).
   * `header` = compact top bar (legacy).
   */
  variant?: "hero" | "header" | "card";
};

export function TripPresenceFacepile({
  peers = [],
  heroEntries,
  variant = "card",
}: TripPresenceFacepileProps) {
  const isHero = variant === "hero";
  const isHeader = variant === "header";

  if (isHero) {
    const list = heroEntries ?? [];
    if (list.length === 0) {
      return null;
    }
    const names = list.map((e) => `${e.label}${e.online ? "" : " (offline)"}`).join(", ");
    const capped = list.slice(0, MAX_VISIBLE);
    const overflow = list.length > MAX_VISIBLE ? list.length - MAX_VISIBLE : 0;
    const overlap = "-space-x-2.5";
    const sizeClass = "h-11 w-11";
    const iconClass = "h-5 w-5";

    /** Online: full color + emerald ring. Offline: grayscale + muted ring until they join this page. */
    const ringOnline =
      "border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_4px_16px_rgba(16,185,129,0.32)]";
    const ringOffline = "border-2 border-white/25 shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.35)]";
    const photoOnline = "grayscale-0";
    const photoOffline = "grayscale";

    return (
      <div
        className="pointer-events-none flex items-center justify-center"
        role="group"
        aria-label={names}
      >
        <div className={`flex items-center justify-center ${overlap}`}>
          {overflow > 0 ? (
            <div
              className={`relative z-[1] flex ${sizeClass} min-w-[2.75rem] items-center justify-center rounded-full border-2 border-white/40 bg-black/35 text-[11px] font-semibold tabular-nums text-white shadow-[0_2px_10px_rgba(0,0,0,0.4)]`}
              title={`+${overflow}`}
            >
              +{overflow}
            </div>
          ) : null}
          {capped.map((e, i) => (
            <div
              key={e.userId}
              className="relative rounded-full"
              style={{ zIndex: 10 + i }}
              title={e.online ? e.label : `${e.label} (offline)`}
            >
              {e.avatarUrl ? (
                <img
                  src={e.avatarUrl}
                  alt=""
                  className={`${sizeClass} rounded-full object-cover transition-[filter,box-shadow] duration-300 ${e.online ? ringOnline : ringOffline} ${e.online ? photoOnline : photoOffline}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`flex ${sizeClass} items-center justify-center rounded-full transition-colors duration-300 ${e.online ? ringOnline : ringOffline} ${e.online ? "bg-emerald-950/35 text-emerald-50" : "bg-white/10 text-white/60"}`}
                  aria-hidden
                >
                  <User className={iconClass} strokeWidth={1.75} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (peers.length === 0) {
    if (variant === "header") {
      return null;
    }
    return (
      <div
        className="mx-auto flex h-11 w-11 animate-pulse rounded-full bg-white/15"
        aria-hidden
      />
    );
  }

  const names = peers.map((p) => p.label).join(", ");

  const sizeClass = isHeader ? "h-8 w-8" : "h-10 w-10";
  const iconClass = isHeader ? "h-3.5 w-3.5" : "h-4 w-4";
  const overlap = "-space-x-2";

  const capped = isHeader ? peers.slice(0, MAX_VISIBLE) : peers;
  const overflow = isHeader && peers.length > MAX_VISIBLE ? peers.length - MAX_VISIBLE : 0;

  const ringClass = "border border-white/30";

  return (
    <div
      className={
        isHeader
          ? "flex items-center"
          : "flex flex-wrap items-center justify-center gap-2 sm:justify-start"
      }
      role="group"
      aria-label={names}
    >
      <div className={`flex items-center ${overlap}`}>
        {overflow > 0 ? (
          <div
            className={`relative z-[1] flex ${sizeClass} min-w-[1.75rem] items-center justify-center rounded-full ${ringClass} bg-black/25 text-[9px] font-medium tabular-nums text-white/90`}
            title={`+${overflow}`}
          >
            +{overflow}
          </div>
        ) : null}
        {capped.map((p, i) => (
          <div
            key={p.userId}
            className="relative"
            style={{ zIndex: 10 + i }}
            title={p.label}
          >
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt=""
                className={`${sizeClass} rounded-full ${ringClass} object-cover shadow-sm`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`flex ${sizeClass} items-center justify-center rounded-full ${ringClass} bg-white/10 text-white/90`}
                aria-hidden
              >
                <User className={iconClass} strokeWidth={2} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
