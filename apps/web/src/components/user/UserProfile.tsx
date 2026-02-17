"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useCallback, useRef } from "react";
import { LogOut } from "lucide-react";
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
}) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
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
    avatarColor: data.avatarColor || "#ff6b6b",
    avatarUrl: data.avatarUrl || undefined,
  });

  const displayData = isEditing ? pendingChanges : {
    displayName: data.displayName,
    avatarColor: data.avatarColor || "#ff6b6b",
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
      avatarColor: data.avatarColor || "#ff6b6b",
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
              avatarColor: profile.avatar_color || data.avatarColor || "#ff6b6b",
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
      avatarColor: data.avatarColor || "#ff6b6b",
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
