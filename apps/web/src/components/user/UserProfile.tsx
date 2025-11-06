"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHeader from "./ProfileHeader";
import ProfileHero from "./ProfileHero";
import ProfileStats from "./ProfileStats";
import ProfileError from "./ProfileError";
import { useTranslation } from "react-i18next";

export type UserProfileData = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date | null;
  lastSignInAt: Date | null;
  avatarColor: string | null;
};

export default function UserProfile({
  data,
  onBack,
  onSave,
  saving,
  error,
  clearError,
}: {
  data: UserProfileData;
  onBack: () => void;
  onSave: (updates: { displayName: string; avatarColor: string }) => Promise<boolean | void>;
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
  }>({
    displayName: data.displayName,
    avatarColor: data.avatarColor || "#ff6b6b",
  });

  const displayData = isEditing ? pendingChanges : {
    displayName: data.displayName,
    avatarColor: data.avatarColor || "#ff6b6b",
  };

  const avatarLetter = useMemo(() => {
    const base = displayData.displayName || data.email || "U";
    return base[0]?.toUpperCase() ?? "U";
  }, [displayData.displayName, data.email]);

  const handleEdit = () => {
    // Reset pending changes to current data when entering edit mode
    setPendingChanges({
      displayName: data.displayName,
      avatarColor: data.avatarColor || "#ff6b6b",
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
    });
    setIsEditing(false);
  };

  const handleChange = (field: "displayName" | "avatarColor", value: string) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
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
        signOut={async () => {
          try {
            await signOut();
            window.location.href = "/auth";
          } catch {
            // Error already handled by signOut
          }
        }}
      />

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <ProfileHero
          data={data}
          displayData={displayData}
          isEditing={isEditing}
          onChange={handleChange}
          avatarLetter={avatarLetter}
        />

        <ProfileStats />

        {error && <ProfileError message={error} clearError={clearError} />}
      </motion.div>
    </div>
  );
}
