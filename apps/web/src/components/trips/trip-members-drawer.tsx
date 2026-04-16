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
import {
  ApiError,
  fetchTripMembers,
  patchTripMemberRole,
  removeTripMember,
  type TripMemberWithProfile,
} from "@/lib/api/trips";
import type { TripMemberRole } from "@gotrippin/core";
import { avatarUrlFromProfiles, displayNameFromProfiles } from "@/lib/trip-member-profile";

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

export interface TripMembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  /** Opens the existing invite-by-email dialog (parent owns dialog state). */
  onInviteByEmail: () => void;
  /** When false, hide invite (viewer). */
  canEdit?: boolean;
  /** Trip creator — only they can change roles. */
  tripCreatorId?: string | null;
}

function roleLabel(role: TripMemberRole | undefined, t: (k: string) => string): string {
  if (role === "viewer") {
    return t("trips.member_role_viewer");
  }
  return t("trips.member_role_editor");
}

export function TripMembersDrawer({
  open,
  onOpenChange,
  tripId,
  onInviteByEmail,
  canEdit = true,
  tripCreatorId = null,
}: TripMembersDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [members, setMembers] = useState<TripMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const currentUserId = user?.id ?? null;

  const [roleSaving, setRoleSaving] = useState<string | null>(null);

  const memberRows = useMemo(() => {
    return members.map((m) => {
      const name = displayNameFromProfiles(m.profiles);
      const label = name.length > 0 ? name : m.user_id;
      const isYou = currentUserId !== null && m.user_id === currentUserId;
      const imageUrl = avatarUrlFromProfiles(m.profiles);
      const role: TripMemberRole = m.role === "viewer" ? "viewer" : "editor";
      return { userId: m.user_id, label, isYou, imageUrl, role };
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

  const handleRoleChange = useCallback(
    async (memberUserId: string, next: TripMemberRole) => {
      if (!tripId || !currentUserId || tripCreatorId !== currentUserId) {
        return;
      }
      setRoleSaving(memberUserId);
      try {
        await patchTripMemberRole(tripId, memberUserId, next);
        toast.success(t("trips.member_role_updated"));
        await loadMembers();
        router.refresh();
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : t("trips.member_role_update_failed");
        console.error("TripMembersDrawer: patchTripMemberRole failed", err);
        toast.error(t("trips.member_role_update_failed"), { description: msg });
      } finally {
        setRoleSaving(null);
      }
    },
    [tripId, currentUserId, tripCreatorId, loadMembers, router, t]
  );

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
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{row.label}</span>
                      {row.isYou ? (
                        <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-xs text-primary">
                          {t("trip_overview.members_you_badge")}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">{roleLabel(row.role, t)}</span>
                      {tripCreatorId !== null &&
                      currentUserId === tripCreatorId &&
                      row.userId !== tripCreatorId ? (
                        <label className="sr-only" htmlFor={`member-role-${row.userId}`}>
                          {t("trips.member_role_select")}
                        </label>
                      ) : null}
                      {tripCreatorId !== null &&
                      currentUserId === tripCreatorId &&
                      row.userId !== tripCreatorId ? (
                        <select
                          id={`member-role-${row.userId}`}
                          className="h-8 max-w-[9rem] rounded-md border border-border/60 bg-background px-2 text-xs"
                          value={row.role}
                          disabled={roleSaving === row.userId}
                          onChange={(e) => {
                            const v = e.target.value === "viewer" ? "viewer" : "editor";
                            void handleRoleChange(row.userId, v);
                          }}
                        >
                          <option value="editor">{t("trips.member_role_editor")}</option>
                          <option value="viewer">{t("trips.member_role_viewer")}</option>
                        </select>
                      ) : null}
                    </div>
                  </div>
                  <MemberAvatar label={row.label} imageUrl={row.imageUrl} />
                </li>
              ))}
            </ul>
          </div>

          <DrawerFooter className="border-t border-border/40 pt-2 dark:border-white/10">
            {canEdit ? (
              <Button type="button" className="w-full" onClick={handleInvite}>
                {t("trip_overview.menu_invite_email")}
              </Button>
            ) : null}
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
