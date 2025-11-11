"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  
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
    avatarUrl: data.avatarUrl,
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

  const handleEdit = () => {
    // Reset pending changes to current data when entering edit mode
    setPendingChanges({
      displayName: data.displayName,
      avatarColor: data.avatarColor || "#ff6b6b",
      avatarUrl: data.avatarUrl || undefined,
    });
    setIsEditing(true);
  };

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
  };

  const handleChange = (field: "displayName" | "avatarColor", value: string) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (url: string) => {
    setPendingChanges(prev => ({ ...prev, avatarUrl: url }));
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

        {/* Logout button */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={async () => {
              try {
                await signOut();
                // Wait a bit to ensure session is cleared
                await new Promise(resolve => setTimeout(resolve, 300));
                // Force a full page reload to clear all state
                window.location.replace("/auth");
              } catch (error) {
                console.error("Logout error:", error);
                // Force redirect anyway
                window.location.replace("/auth");
              }
            }}
            className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10 transition-all"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-4 h-4" />
            {t("profile.logout")}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
