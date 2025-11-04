"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, Globe, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { UserProfileData } from "./UserProfile";
import { useTranslation } from "react-i18next";

export default function ProfileHero({
  data,
  local,
  setLocal,
  isEditing,
  avatarLetter,
  onSave,
}: {
  data: UserProfileData;
  local: { displayName: string; phone: string; avatarColor: string };
  setLocal: React.Dispatch<React.SetStateAction<typeof local>>;
  isEditing: boolean;
  avatarLetter: string;
  onSave: () => Promise<void>;
}) {
  const { t } = useTranslation();

  const formatMonthYear = (d: Date | null) =>
    d ? d.toLocaleString(undefined, { month: "short", year: "numeric" }) : "—";

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]"
      style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25 }}
    >
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #ff6b6b 0%, #ff8585 50%, #ffa07a 100%)",
          }}
        />
      </div>

      <div className="relative px-6 pb-6">
        <div className="relative -mt-16 mb-4">
          <motion.div
            className="w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#17131a] shadow-xl"
            style={{ background: local.avatarColor || "var(--color-accent)" }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-white text-5xl font-bold">{avatarLetter}</span>
          </motion.div>
          {isEditing && (
            <motion.input
              type="color"
              value={local.avatarColor || "#ff6b6b"}
              onChange={(e) =>
                setLocal((s) => ({ ...s, avatarColor: e.target.value }))
              }
              className="absolute bottom-2 right-2 w-10 h-10 rounded-xl cursor-pointer border border-white/20 bg-black/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
            />
          )}
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <Input
              value={local.displayName}
              onChange={(e) =>
                setLocal((s) => ({ ...s, displayName: e.target.value }))
              }
              className="text-2xl font-bold bg-white/[0.05] border-white/[0.08] text-white"
              placeholder={t("profile.display_name")}
            />
          ) : (
            <h2 className="text-2xl font-bold text-white">
              {data.displayName || t("profile.traveler")}
            </h2>
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

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {isEditing ? (
              <Input
                value={local.phone}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, phone: e.target.value }))
                }
                className="h-9 bg-white/[0.05] border-white/[0.08] text-white text-sm"
                placeholder={t("profile.phone")}
              />
            ) : (
              <span className="text-white/80">
                {data.phone || t("profile.no_phone")}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
