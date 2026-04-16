"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, fetchTripMembers, removeTripMember, type TripMemberWithProfile } from "@/lib/api/trips";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function displayNameFromProfiles(profiles: unknown): string {
  if (profiles === null || profiles === undefined) {
    return "";
  }
  if (Array.isArray(profiles)) {
    const first = profiles[0];
    if (isRecord(first) && typeof first.display_name === "string" && first.display_name.trim().length > 0) {
      return first.display_name.trim();
    }
    return "";
  }
  if (isRecord(profiles) && typeof profiles.display_name === "string" && profiles.display_name.trim().length > 0) {
    return profiles.display_name.trim();
  }
  return "";
}

function avatarUrlFromProfiles(profiles: unknown): string | null {
  if (profiles === null || profiles === undefined) {
    return null;
  }
  if (Array.isArray(profiles)) {
    const first = profiles[0];
    if (isRecord(first) && typeof first.avatar_url === "string" && first.avatar_url.trim().length > 0) {
      return first.avatar_url.trim();
    }
    return null;
  }
  if (isRecord(profiles) && typeof profiles.avatar_url === "string" && profiles.avatar_url.trim().length > 0) {
    return profiles.avatar_url.trim();
  }
  return null;
}

function MemberAvatar({
  label,
  imageUrl,
  size = "md",
}: {
  label: string;
  imageUrl: string | null;
  size?: "sm" | "md";
}) {
  const initial = label.trim().length > 0 ? label.trim().charAt(0).toUpperCase() : "?";
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={`${dim} shrink-0 rounded-full border-2 border-black/25 object-cover ring-2 ring-white/15 dark:border-white/20`}
      />
    );
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full border-2 border-black/25 bg-muted font-semibold text-foreground ring-2 ring-white/15 dark:border-white/20 dark:bg-white/10 dark:text-white`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

const DRAWER_FACEPILE_MAX = 6;

function DrawerFooterFacepile({
  entries,
}: {
  entries: readonly { userId: string; imageUrl: string | null; label: string }[];
}) {
  if (entries.length === 0) {
    return null;
  }
  const overflow = entries.length > DRAWER_FACEPILE_MAX ? entries.length - DRAWER_FACEPILE_MAX : 0;
  const tail =
    entries.length <= DRAWER_FACEPILE_MAX
      ? entries
      : entries.slice(entries.length - DRAWER_FACEPILE_MAX);

  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-0 pb-2">
      <div className="flex items-center -space-x-2">
        {overflow > 0 ? (
          <div
            className="relative z-[1] flex h-8 min-w-[2rem] items-center justify-center rounded-full border-2 border-border/60 bg-muted px-1 text-[10px] font-semibold tabular-nums text-foreground dark:border-white/20 dark:bg-white/10"
            title={`+${overflow}`}
          >
            +{overflow}
          </div>
        ) : null}
        {tail.map((e, i) => (
          <div key={e.userId} className="relative" style={{ zIndex: 2 + i }}>
            <MemberAvatar label={e.label} imageUrl={e.imageUrl} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TripMembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  /** Opens the existing invite-by-email dialog (parent owns dialog state). */
  onInviteByEmail: () => void;
}

export function TripMembersDrawer({ open, onOpenChange, tripId, onInviteByEmail }: TripMembersDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [members, setMembers] = useState<TripMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const currentUserId = user?.id ?? null;

  const memberRows = useMemo(() => {
    return members.map((m) => {
      const name = displayNameFromProfiles(m.profiles);
      const label = name.length > 0 ? name : m.user_id;
      const isYou = currentUserId !== null && m.user_id === currentUserId;
      const imageUrl = avatarUrlFromProfiles(m.profiles);
      return { userId: m.user_id, label, isYou, imageUrl };
    });
  }, [members, currentUserId]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchTripMembers(tripId);
      setMembers(rows);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("trip_overview.members_load_failed");
      console.error("TripMembersDrawer: fetchTripMembers failed", err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

  useEffect(() => {
    if (!open || !tripId) {
      return;
    }
    void loadMembers();
  }, [open, tripId, loadMembers]);

  const handleInvite = () => {
    onOpenChange(false);
    onInviteByEmail();
  };

  const handleLeaveTrip = async () => {
    if (!currentUserId || !tripId) {
      return;
    }
    setLeaving(true);
    try {
      await removeTripMember(tripId, currentUserId);
      toast.success(t("trip_overview.members_left_success"));
      setLeaveConfirmOpen(false);
      onOpenChange(false);
      router.push("/trips");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("trip_overview.members_leave_failed");
      console.error("TripMembersDrawer: removeTripMember failed", err);
      toast.error(t("trip_overview.members_leave_failed"), { description: msg });
    } finally {
      setLeaving(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-0.5rem))]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t("trip_overview.members_drawer_title")}</DrawerTitle>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-2">
            {loading && members.length === 0 && !loadError ? (
              <p className="text-sm text-muted-foreground">{t("trip_overview.members_loading")}</p>
            ) : null}
            {loadError && !loading ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{loadError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadMembers()}>
                  {t("trip_overview.members_retry")}
                </Button>
              </div>
            ) : null}
            {!loading && !loadError && members.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("trip_overview.members_empty")}</p>
            ) : null}
            <ul className="flex flex-col gap-2">
              {memberRows.map((row) => (
                <li
                  key={row.userId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/15 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-medium">{row.label}</span>
                    {row.isYou ? (
                      <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                        {t("trip_overview.members_you_badge")}
                      </span>
                    ) : null}
                  </div>
                  <MemberAvatar label={row.label} imageUrl={row.imageUrl} />
                </li>
              ))}
            </ul>
          </div>

          <DrawerFooter className="border-t border-border/40 pt-2 dark:border-white/10">
            <DrawerFooterFacepile entries={memberRows} />
            <Button type="button" className="w-full" onClick={handleInvite}>
              {t("trip_overview.menu_invite_email")}
            </Button>
            {currentUserId ? (
              <Button type="button" variant="outline" className="w-full" onClick={() => setLeaveConfirmOpen(true)}>
                {t("trip_overview.members_leave_trip")}
              </Button>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("trip_overview.members_leave_confirm_title")}</DialogTitle>
            <DialogDescription>{t("trip_overview.members_leave_confirm_description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setLeaveConfirmOpen(false)} disabled={leaving}>
              {t("trips.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleLeaveTrip()} disabled={leaving}>
              {t("trip_overview.members_leave_confirm_action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
