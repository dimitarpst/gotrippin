"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const REALTIME_DEBOUNCE_MS = 400;
/** Avoid hammering the server when DevTools or other windows steal focus repeatedly. */
const VISIBILITY_REFRESH_MIN_MS = 8000;

/**
 * Subscribes to Postgres changes for this trip and debounces `router.refresh()`.
 * Requires Supabase RLS SELECT on `trips`, `trip_locations`, `activities`, `trip_members` + publication (see migrations).
 */
export function useTripRealtimeSync(tripId: string | undefined) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      router.refresh();
      timerRef.current = null;
    }, REALTIME_DEBOUNCE_MS);
  }, [router]);

  const lastVisibilityRefreshRef = useRef<number>(0);

  /** When Realtime postgres_changes is unavailable (migration/RLS/publication), tab focus still picks up server state. */
  useEffect(() => {
    if (!tripId) {
      return;
    }
    const onBecameVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const now = Date.now();
      if (now - lastVisibilityRefreshRef.current < VISIBILITY_REFRESH_MIN_MS) {
        return;
      }
      lastVisibilityRefreshRef.current = now;
      router.refresh();
    };
    document.addEventListener("visibilitychange", onBecameVisible);
    window.addEventListener("focus", onBecameVisible);
    return () => {
      document.removeEventListener("visibilitychange", onBecameVisible);
      window.removeEventListener("focus", onBecameVisible);
    };
  }, [tripId, router]);

  useEffect(() => {
    if (!tripId) {
      return;
    }

    const channel = supabase
      .channel(`trip-sync:${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_locations",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          scheduleRefresh();
        },
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("useTripRealtimeSync: channel issue", status, err);
        }
      });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [tripId, scheduleRefresh]);
}

export interface TripPresencePeer {
  userId: string;
  label: string;
  /** From `profiles.avatar_url` when RLS allows; otherwise null (initials shown). */
  avatarUrl: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shortUserIdHint(userId: string): string {
  const compact = userId.replace(/-/g, "");
  const prefix = compact.slice(0, 6);
  return prefix.length > 0 ? `…${prefix}` : "…";
}

function normalizeMetaArray(
  raw: unknown,
): Record<string, unknown>[] {
  if (raw === null || raw === undefined) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null);
  }
  if (typeof raw === "object") {
    return [raw as Record<string, unknown>];
  }
  return [];
}

function avatarFromMeta(meta: Record<string, unknown>): string | null {
  const a = meta.avatar_url ?? meta.avatarUrl;
  if (typeof a === "string" && a.trim().length > 0) {
    return a.trim();
  }
  return null;
}

function labelFromMeta(meta: Record<string, unknown>, selfFallback: string): string {
  const candidates = [
    meta.label,
    meta.name,
    meta.display_name,
    meta.displayName,
    meta.full_name,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return selfFallback;
}

function peersFromPresenceState(
  state: Record<string, unknown>,
  selfUserId: string,
  selfFallbackLabel: string,
): TripPresencePeer[] {
  const next: TripPresencePeer[] = [];
  const seen = new Set<string>();

  for (const presenceKey of Object.keys(state)) {
    const metasRaw = state[presenceKey];
    const metas = normalizeMetaArray(metasRaw);

    const uidFromKey = UUID_RE.test(presenceKey) ? presenceKey : null;

    for (const meta of metas) {
      const uidRaw =
        (typeof meta.user_id === "string" && meta.user_id.length > 0
          ? meta.user_id
          : null) ??
        (typeof meta.userId === "string" && meta.userId.length > 0 ? meta.userId : null) ??
        uidFromKey;

      if (typeof uidRaw !== "string" || uidRaw.length === 0) {
        continue;
      }

      const fallback =
        uidRaw === selfUserId ? selfFallbackLabel : shortUserIdHint(uidRaw);
      const plabel = labelFromMeta(meta, fallback);

      if (!seen.has(uidRaw)) {
        seen.add(uidRaw);
        next.push({ userId: uidRaw, label: plabel, avatarUrl: avatarFromMeta(meta) });
      }
    }

    // If there are no meta rows but the key is a UUID (presence key = user id), still show someone.
    if (metas.length === 0 && uidFromKey !== null && !seen.has(uidFromKey)) {
      seen.add(uidFromKey);
      next.push({
        userId: uidFromKey,
        label:
          uidFromKey === selfUserId
            ? selfFallbackLabel
            : shortUserIdHint(uidFromKey),
        avatarUrl: null,
      });
    }
  }

  return next;
}

/**
 * Tracks who is currently on this trip page (Presence). Display names only.
 */
export function useTripPresencePeers(tripId: string | undefined, displayName: string) {
  const { user } = useAuth();
  const [peers, setPeers] = useState<TripPresencePeer[]>([]);

  useEffect(() => {
    if (!tripId || !user?.id) {
      setPeers([]);
      return;
    }

    const selfAvatarUrl =
      typeof user.avatar_url === "string" && user.avatar_url.trim().length > 0
        ? user.avatar_url.trim()
        : null;

    const selfFallbackLabel =
      displayName.trim().length > 0
        ? displayName.trim()
        : typeof user.email === "string" && user.email.length > 0
          ? user.email.split("@")[0]
          : "Traveler";

    const channel = supabase.channel(`trip-presence:${tripId}`, {
      config: { presence: { key: user.id } },
    });

    const pushPresence = () => {
      const state = channel.presenceState() as Record<string, unknown>;
      const base = peersFromPresenceState(state, user.id, selfFallbackLabel);

      const ids = base.map((p) => p.userId).filter((id) => id.length > 0);
      if (ids.length === 0) {
        setPeers(base);
        return;
      }

      void supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids)
        .then(({ data, error }) => {
          if (error) {
            console.error("useTripPresencePeers: profile labels fetch failed", error);
            setPeers(base);
            return;
          }
          const nameById = new Map<string, string>();
          const avatarById = new Map<string, string | null>();
          if (Array.isArray(data)) {
            for (const row of data) {
              if (!row || typeof row !== "object" || !("id" in row) || typeof row.id !== "string") {
                continue;
              }
              if (
                "display_name" in row &&
                typeof row.display_name === "string" &&
                row.display_name.trim().length > 0
              ) {
                nameById.set(row.id, row.display_name.trim());
              }
              if ("avatar_url" in row && typeof row.avatar_url === "string" && row.avatar_url.trim().length > 0) {
                avatarById.set(row.id, row.avatar_url.trim());
              }
            }
          }
          setPeers(
            base.map((p) => {
              const name = nameById.get(p.userId) ?? p.label;
              const fromProfile = avatarById.get(p.userId);
              const avatarUrl =
                p.userId === user.id
                  ? selfAvatarUrl ?? fromProfile ?? p.avatarUrl
                  : fromProfile ?? p.avatarUrl ?? null;
              return {
                ...p,
                label: name,
                avatarUrl,
              };
            }),
          );
        });
    };

    channel.on("presence", { event: "sync" }, pushPresence);
    channel.on("presence", { event: "join" }, pushPresence);
    channel.on("presence", { event: "leave" }, pushPresence);

    void channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          label: selfFallbackLabel,
          name: selfFallbackLabel,
          display_name: selfFallbackLabel,
          ...(selfAvatarUrl ? { avatar_url: selfAvatarUrl } : {}),
          online_at: new Date().toISOString(),
        });
        pushPresence();
      }
    });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
      setPeers([]);
    };
  }, [tripId, user?.id, displayName, user?.email, user?.avatar_url]);

  return peers;
}
