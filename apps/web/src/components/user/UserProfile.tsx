"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileHero from "./ProfileHero";
import ProfileStats from "./ProfileStats";
import ProfileError from "./ProfileError";
import { useTranslation } from "react-i18next";

export type UserProfileData = {
  uid: string;
  email: string;
  phone: string;
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
  onSave: (updates: { displayName: string; phone: string; avatarColor: string | null }) => Promise<void> | void;
  saving?: boolean;
  error?: string | null;
  clearError?: () => void;
}) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [local, setLocal] = useState({
    displayName: data.displayName || "",
    phone: data.phone || "",
    avatarColor: data.avatarColor || "var(--color-accent)",
  });

  const avatarLetter = useMemo(() => {
    const base = local.displayName || data.email || "U";
    return base[0]?.toUpperCase() ?? "U";
  }, [local.displayName, data.email]);

  const handleSave = async () => {
    await onSave({
      displayName: local.displayName.trim(),
      phone: local.phone.trim(),
      avatarColor: local.avatarColor || null,
    });
    if (!error) {
      setIsEditing(false);
      // Sync local state with the updated data after successful save
      setLocal({
        displayName: data.displayName || "",
        phone: data.phone || "",
        avatarColor: data.avatarColor || "var(--color-accent)",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset local state to current data when canceling
    setLocal({
      displayName: data.displayName || "",
      phone: data.phone || "",
      avatarColor: data.avatarColor || "var(--color-accent)",
    });
  };

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      <ProfileHeader
        title={t("profile.title")}
        onBack={onBack}
        isEditing={isEditing}
        setIsEditing={handleCancelEdit}
        onSave={handleSave}
        saving={saving}
        clearError={clearError}
        signOut={async () => {
          await signOut();
          router.push("/auth");
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
          local={local}
          setLocal={setLocal}
          isEditing={isEditing}
          avatarLetter={avatarLetter}
          onSave={handleSave}
        />

        <ProfileStats />

        {error && <ProfileError message={error} clearError={clearError} />}
      </motion.div>
    </div>
  );
}
