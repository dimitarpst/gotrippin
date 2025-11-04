"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Edit2, Check, X, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfileHeader({
  title,
  onBack,
  isEditing,
  setIsEditing,
  onSave,
  saving,
  clearError,
  signOut,
}: {
  title: string;
  onBack: () => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
  clearError?: () => void;
  signOut: () => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <motion.header
      className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.08]"
      style={{ background: "rgba(14, 11, 16, 0.8)" }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={signOut}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/10 hover:bg-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-4 h-4" />
            {t("profile.logout")}
          </motion.button>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.button
                key="edit"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 bg-[#ff6b6b] text-white"
                whileHover={{ scale: 1.05, background: "#ff8585" }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit2 className="w-4 h-4" />
                {t("profile.edit")}
              </motion.button>
            ) : (
              <motion.div
                key="actions"
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.button
                  onClick={() => {
                    clearError?.();
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  {t("profile.cancel")}
                </motion.button>
                <motion.button
                  disabled={!!saving}
                  onClick={onSave}
                  className="px-4 py-2 rounded-xl text-sm flex items-center gap-2 bg-[#ff6b6b] text-white disabled:opacity-60"
                  whileHover={{ scale: 1.05, background: "#ff8585" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check className="w-4 h-4" />
                  {saving ? t("profile.saving") : t("profile.save")}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
