"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useCallback, useRef } from "react";
import { LogOut, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHeader from "./ProfileHeader";
import ProfileHero from "./ProfileHero";
import ProfileError from "./ProfileError";
import ChangeEmailCard from "./ChangeEmailCard";
import ChangePasswordCard from "./ChangePasswordCard";
import LinkedAccountsCard from "./LinkedAccountsCard";
import ThemeSettingsCard from "./ThemeSettingsCard";
import EmailConfirmationBanner from "./EmailConfirmationBanner";
import { useTranslation } from "react-i18next";
import { ExtendedUser } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import AuroraBackground from "@/components/effects/aurora-background";

export type UserProfileData = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date | null;
  lastSignInAt: Date | null;
  avatarColor: string | null;
  avatarUrl?: string | null;
};

export type UserAiUsageData = {
  used: number;
  limit: number | null;
  percent: number | null;
};

export default function UserProfile({
  data,
  aiUsage,
  user,
  onBack,
  onSave,
  saving,
  error,
  clearError,
  onShowTipsAgain,
}: {
  data: UserProfileData;
  aiUsage: UserAiUsageData;
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background pb-24 text-foreground">
      <AuroraBackground />
      <ProfileHeader
        title={t("profile.title")}
        onBack={onBack}
        isEditing={isEditing}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
        <motion.div
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
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

        {/* AI Usage Card */}
        <motion.div
          className="relative mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.1 }}
        >
          <div className="glass-panel relative overflow-hidden rounded-3xl">
          <div className="px-4 sm:px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                <Logo variant="sm" className="h-5 w-auto" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-medium text-foreground">
                    {t("profile.ai_usage")}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {aiUsage.percent != null
                      ? t("profile.ai_usage_value", { percent: aiUsage.percent })
                      : t("profile.ai_usage_unlimited")}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {aiUsage.limit != null
                    ? t("profile.ai_usage_tokens", {
                        used: new Intl.NumberFormat().format(aiUsage.used),
                        limit: new Intl.NumberFormat().format(aiUsage.limit),
                      })
                    : t("profile.ai_usage_tokens_used", {
                        used: new Intl.NumberFormat().format(aiUsage.used),
                      })}
                </p>
                {aiUsage.percent != null ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${aiUsage.percent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          </div>
        </motion.div>

        {error && <ProfileError message={error} clearError={clearError} />}

        {/* Email and Password Change Cards */}
        <div className="space-y-4 mt-6">
          <ThemeSettingsCard />
          {hasPassword && <ChangeEmailCard currentEmail={data.email} />}
          <ChangePasswordCard hasPassword={hasPassword ?? false} />
          <LinkedAccountsCard
            hasEmailPassword={hasPassword ?? false}
            hasGoogle={hasGoogle}
            googleEmail={googleEmail}
          />
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.25 }}
          >
            <div className="glass-panel relative overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between gap-3 px-4 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t("profile.tips_title", { defaultValue: "Tips & onboarding" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
                className="shrink-0 cursor-pointer border-border bg-muted/50 hover:bg-muted"
              >
                {t("profile.show_tips_again", { defaultValue: "Show tips again" })}
              </Button>
            </div>
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
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/60 px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            {t("profile.logout")}
          </button>
        </div>
        </motion.div>
      </div>
    </main>
  );
}
