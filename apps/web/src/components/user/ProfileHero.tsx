"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, Star, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/auth/AvatarUpload";
import type { UserProfileData } from "./UserProfile";
import { useTranslation } from "react-i18next";

export default function ProfileHero({
  data,
  displayData,
  isEditing,
  onChange,
  avatarLetter,
  onAvatarUpload,
  googleAvatarUrl,
  editSessionId,
}: {
  data: UserProfileData;
  displayData: { displayName: string; avatarColor: string };
  isEditing: boolean;
  onChange: (field: "displayName" | "avatarColor", value: string) => void;
  avatarLetter: string;
  onAvatarUpload?: (url: string) => void;
  googleAvatarUrl?: string | null;
  editSessionId: number;
}) {
  const { t } = useTranslation();

  const formatMonthYear = (d: Date | null) =>
    d ? d.toLocaleString(undefined, { month: "short", year: "numeric" }) : "—";

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden mb-6 border border-white/8"
      style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25 }}
    >
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${displayData.avatarColor} 0%, ${displayData.avatarColor}cc 50%, ${displayData.avatarColor}99 100%)`,
          }}
        />
      </div>

      <div className="relative px-6 pb-6">
        <div className="relative -mt-16 mb-4 flex items-end gap-4">
          <motion.div
            className="w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#17131a] shadow-xl relative"
            style={{ background: displayData.avatarColor }}
            whileHover={{ scale: isEditing ? 1.05 : 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt={displayData.displayName}
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  // Hide the broken image and show the letter fallback
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <span
              className={`text-white text-5xl font-bold avatar-fallback ${data.avatarUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
            >
              {avatarLetter}
            </span>
          </motion.div>
          
          {isEditing && (
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label
                htmlFor="avatar-color"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer transition text-sm text-white/80"
              >
                <Palette className="w-4 h-4" />
                {t("profile.change_color")}
              </label>
              <input
                id="avatar-color"
                type="color"
                value={displayData.avatarColor}
                onChange={(e) => onChange("avatarColor", e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <Input
              value={displayData.displayName}
              onChange={(e) => onChange("displayName", e.target.value)}
              className="text-2xl font-bold bg-white/5 border-white/8 text-white"
              placeholder={t("profile.display_name")}
            />
          ) : (
            <h2 className="text-2xl font-bold text-white">
              {displayData.displayName || t("profile.traveler")}
            </h2>
          )}

          {isEditing && (
            <AvatarUpload
              userId={data.uid}
              currentAvatarUrl={data.avatarUrl}
              googleAvatarUrl={googleAvatarUrl}
              onUploadSuccess={onAvatarUpload || (() => {})}
              isEditing={isEditing}
              editSessionId={editSessionId}
            />
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="break-all">{data.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{t("profile.joined")} {formatMonthYear(data.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>{t("profile.last_signin")} {formatMonthYear(data.lastSignInAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
