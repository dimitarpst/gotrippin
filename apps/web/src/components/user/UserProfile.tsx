"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mail, Calendar, Edit2, Check, X, Globe, Star, Plane,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

type UserProfileData = {
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
  const [isEditing, setIsEditing] = useState(false);

  const [local, setLocal] = useState({
    displayName: data.displayName || "",
    phone: data.phone || "",
    avatarColor: data.avatarColor || "var(--color-accent)",
  });

  useEffect(() => {
    if (
      local.displayName !== data.displayName ||
      local.phone !== data.phone ||
      local.avatarColor !== data.avatarColor
    ) {
      setLocal({
        displayName: data.displayName || "",
        phone: data.phone || "",
        avatarColor: data.avatarColor || "var(--color-accent)",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.displayName, data.phone, data.avatarColor]);


  const avatarLetter = useMemo(() => {
    const base = local.displayName || data.email || "U";
    return base[0]?.toUpperCase() ?? "U";
  }, [local.displayName, data.email]);

  const formatMonthYear = (d: Date | null) =>
    d ? d.toLocaleString(undefined, { month: "short", year: "numeric" }) : "—";

  const handleSave = async () => {
    await onSave({
      displayName: local.displayName.trim(),
      phone: local.phone.trim(),
      avatarColor: local.avatarColor || null,
    });
    if (!error) setIsEditing(false);
  };

  return (
    <div className="min-h-screen relative pb-32 overflow-y-auto scrollbar-hide">
      <motion.header
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.08]"
        style={{ background: "rgba(14, 11, 16, 0.8)" }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 800, damping: 25 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onBack}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
                whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.12)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 800, damping: 25 }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.button
                  key="edit"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
                  style={{ background: "#ff6b6b", color: "white" }}
                  whileHover={{ scale: 1.05, background: "#ff8585" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 800, damping: 25 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              ) : (
                <motion.div
                  key="actions"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.button
                    onClick={() => {
                      setLocal({
                        displayName: data.displayName || "",
                        phone: data.phone || "",
                        avatarColor: data.avatarColor || "var(--color-accent)",
                      });
                      setIsEditing(false);
                      clearError?.();
                    }}
                    className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
                    style={{ background: "rgba(255, 255, 255, 0.08)", color: "white" }}
                    whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.12)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 800, damping: 25 }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                  <motion.button
                    disabled={!!saving}
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-60"
                    style={{ background: "#ff6b6b", color: "white" }}
                    whileHover={{ scale: 1.05, background: "#ff8585" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 800, damping: 25 }}
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Saving…" : "Save"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        {/* Hero Section */}
        <motion.div
          className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]"
          style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 800, damping: 25 }}
        >
          {/* Cover */}
          <div className="relative h-48 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #ff6b6b 0%, #ff8585 50%, #ffa07a 100%)",
              }}
            />
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <motion.div
                className="w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-[#17131a] shadow-xl"
                style={{ background: local.avatarColor || "var(--color-accent)" }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 800, damping: 25 }}
              >
                <span className="text-white text-5xl font-bold">{avatarLetter}</span>
              </motion.div>
              {isEditing && (
                <motion.input
                  type="color"
                  value={
                    /^#([0-9a-f]{3}){1,2}$/i.test(local.avatarColor ?? "")
                      ? (local.avatarColor as string)
                      : "#ff6b6b"
                  }
                  onChange={(e) => setLocal((s) => ({ ...s, avatarColor: e.target.value }))}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-xl cursor-pointer border border-white/20 bg-black/20"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                />
              )}
            </div>

            {/* Name + Info */}
            <div className="space-y-3">
              {isEditing ? (
                <Input
                  value={local.displayName}
                  onChange={(e) => setLocal((s) => ({ ...s, displayName: e.target.value }))}
                  className="text-2xl font-bold bg-white/[0.05] border-white/[0.08] text-white"
                  placeholder="Display name"
                />
              ) : (
                <h2 className="text-2xl font-bold text-white">
                  {data.displayName || "Traveler"}
                </h2>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="break-all">{data.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatMonthYear(data.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>Last sign in {formatMonthYear(data.lastSignInAt)}</span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {isEditing ? (
                  <Input
                    value={local.phone}
                    onChange={(e) => setLocal((s) => ({ ...s, phone: e.target.value }))}
                    className="h-9 bg-white/[0.05] border-white/[0.08] text-white text-sm"
                    placeholder="Phone number"
                  />
                ) : (
                  <span className="text-white/80">{data.phone || "No phone"}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Static bento (kept for vibe) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            className="rounded-2xl p-6 border border-white/[0.08] flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Plane className="w-8 h-8 mb-3" style={{ color: "#ff6b6b" }} />
            <div className="text-4xl font-bold mb-1 text-white">12</div>
            <div className="text-sm text-white/60">Trips Completed</div>
          </motion.div>
          <motion.div
            className="rounded-2xl p-6 border border-white/[0.08] flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Globe className="w-8 h-8 mb-3" style={{ color: "#ff6b6b" }} />
            <div className="text-4xl font-bold mb-1 text-white">8</div>
            <div className="text-sm text-white/60">Countries Visited</div>
          </motion.div>
          <motion.div
            className="rounded-2xl p-6 border border-white/[0.08] flex flex-col items-center justify-center text-center"
            style={{ background: "rgba(23, 19, 26, 0.6)", backdropFilter: "blur(20px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Star className="w-8 h-8 mb-3" style={{ color: "#ff6b6b" }} />
            <div className="text-4xl font-bold mb-1 text-white">156</div>
            <div className="text-sm text-white/60">Days Traveling</div>
          </motion.div>
        </div>

        {error && (
          <div className="mt-6 text-center text-sm text-red-400">
            {error} <button onClick={clearError} className="underline">Dismiss</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
