"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useCallback, useRef } from "react";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHeader from "./ProfileHeader";
import ProfileHero from "./ProfileHero";
import ProfileStats from "./ProfileStats";
import ProfileError from "./ProfileError";
import ChangeEmailCard from "./ChangeEmailCard";
import ChangePasswordCard from "./ChangePasswordCard";
import LinkedAccountsCard from "./LinkedAccountsCard";
import EmailConfirmationBanner from "./EmailConfirmationBanner";
import { useTranslation } from "react-i18next";
import { ExtendedUser } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export type UserProfileData = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date | null;
  lastSignInAt: Date | null;
  avatarColor: string | null;
  avatarUrl?: string | null;
};

export default function UserProfile({
  data,
  user,
  onBack,
  onSave,
  saving,
  error,
  clearError,
  onShowTipsAgain,
}: {
  data: UserProfileData;
  user: ExtendedUser | null;
  onBack: () => void;
  onSave: (updates: {
    displayName: string;
    avatarColor: string;
    avatarUrl?: string;
  }) => Promise<boolean | void>;
  saving?: boolean;
  error?: string | null;
  clearError?: () => void;
  onShowTipsAgain?: () => void;
}) {
  const { t } = useTranslation();
  const { signOut, refreshProfile, user: authUser } = useAuth();
  const [editSessionId, setEditSessionId] = useState(0);
  const [editRefreshing, setEditRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const userSelectedAvatarRef = useRef(false);

  // Track pending changes during edit session
  const [pendingChanges, setPendingChanges] = useState<{
    displayName: string;
    avatarColor: string;
    avatarUrl?: string;
  }>({
    displayName: data.displayName,
    avatarColor: data.avatarColor || "#1a1a2e",
    avatarUrl: data.avatarUrl || undefined,
  });

  const displayData = isEditing ? pendingChanges : {
    displayName: data.displayName,
    avatarColor: data.avatarColor || "#1a1a2e",
    avatarUrl: data.avatarUrl ?? undefined,
  };

  const avatarLetter = useMemo(() => {
    const base = displayData.displayName || data.email || "U";
    return base[0]?.toUpperCase() ?? "U";
  }, [displayData.displayName, data.email]);

  const hasPassword = useMemo(
    () => user?.identities?.some((id) => id.provider === "email") ?? false,
    [user]
  );
  const hasGoogle = useMemo(
    () => user?.identities?.some((id) => id.provider === "google") ?? false,
    [user]
  );
  const googleAvatarUrl = useMemo(
    () => (user?.user_metadata?.avatar_url as string | undefined) || null,
    [user]
  );
  const googleEmail = useMemo(
    () => (user?.user_metadata?.email as string | undefined) || null,
    [user]
  );

  const handleEdit = useCallback(() => {
    setEditSessionId((session) => session + 1);
    setIsEditing(true);
    userSelectedAvatarRef.current = false;
    setPendingChanges({
      displayName: data.displayName,
      avatarColor: data.avatarColor || "#1a1a2e",
      avatarUrl: data.avatarUrl || undefined,
    });

    const syncProfile = async () => {
      setEditRefreshing(true);
      try {
        const { data: profile, error: profileError } = await Promise.race([
          supabase
            .from("profiles")
            .select("display_name, avatar_color, avatar_url")
            .eq("id", data.uid)
            .single(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Profile fetch timeout")), 8000)
          ),
        ]);

        if (!profileError && profile) {
          const resolvedAvatarUrl = profile.avatar_url ?? data.avatarUrl ?? undefined;
          setPendingChanges((prev) => {
            const avatarToUse = userSelectedAvatarRef.current
              ? (prev.avatarUrl ?? undefined)
              : resolvedAvatarUrl;
            return {
              displayName: profile.display_name || data.displayName,
              avatarColor: profile.avatar_color || data.avatarColor || "#1a1a2e",
              avatarUrl: avatarToUse,
            };
          });
        }
      } catch (error) {
        console.warn("Failed to refresh profile before editing:", error);
      } finally {
        setEditRefreshing(false);
      }
    };

    void syncProfile();
  }, [data]);

  const handleSave = async () => {
    const success = await onSave(pendingChanges);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setPendingChanges({
      displayName: data.displayName,
      avatarColor: data.avatarColor || "#1a1a2e",
      avatarUrl: data.avatarUrl || undefined,
    });
    setIsEditing(false);
    setEditRefreshing(false);
  };

  const handleChange = (field: "displayName" | "avatarColor", value: string) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (url: string) => {
    userSelectedAvatarRef.current = true;
    setPendingChanges((prev) => ({ ...prev, avatarUrl: url }));
  };

  const [resettingTips, setResettingTips] = useState(false);

  const handleResetCreateTripTour = async () => {
    if (!authUser) return;
    setResettingTips(true);
    try {
      const existing =
        ((authUser.user_metadata?.ui_tours as Record<string, unknown> | undefined) ?? {});
      // Remove create_trip_v1 flag while preserving any other tour keys
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { create_trip_v1: _removed, ...rest } = existing;

      const { error } = await supabase.auth.updateUser({
        data: {
          ui_tours: rest,
        },
      });

      if (error) {
        console.error("Failed to reset create trip tour flag:", error);
        return;
      }

      await refreshProfile();
      if (onShowTipsAgain) {
        onShowTipsAgain();
      }
    } catch (err) {
      console.error("Unexpected error while resetting create trip tour flag:", err);
    } finally {
      setResettingTips(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      <ProfileHeader
        title={t("profile.title")}
        onBack={onBack}
        isEditing={isEditing}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <EmailConfirmationBanner />
        <ProfileHero
          data={data}
          displayData={displayData}
          isEditing={isEditing}
          onChange={handleChange}
          avatarLetter={avatarLetter}
          onAvatarUpload={handleAvatarUpload}
          googleAvatarUrl={googleAvatarUrl}
          editSessionId={editSessionId}
        />

        <ProfileStats />

        {error && <ProfileError message={error} clearError={clearError} />}

        {/* Email and Password Change Cards */}
        <div className="space-y-4 mt-6">
          {hasPassword && <ChangeEmailCard currentEmail={data.email} />}
          <ChangePasswordCard hasPassword={hasPassword ?? false} />
          <LinkedAccountsCard
            hasEmailPassword={hasPassword ?? false}
            hasGoogle={hasGoogle}
            googleEmail={googleEmail}
          />
          <motion.div
            className="relative rounded-3xl overflow-hidden border border-white/8"
            style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.25 }}
          >
            <div className="px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {t("profile.tips_title", { defaultValue: "Tips & onboarding" })}
                  </p>
                  <p className="text-xs text-white/60">
                    {t("profile.tips_description", {
                      defaultValue: "Replay the create trip walkthrough from the start.",
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resettingTips}
                onClick={handleResetCreateTripTour}
                className="shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-white cursor-pointer"
              >
                {t("profile.show_tips_again", { defaultValue: "Show tips again" })}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Logout button — plain button to avoid Framer Motion mount interference */}
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={async () => {
              try {
                await signOut();
                window.location.replace("/auth");
              } catch (error) {
                console.error("Logout error:", error);
                window.location.replace("/auth");
              }
            }}
            className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t("profile.logout")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
