"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Edit2, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfileHeader({
  title,
  onBack,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  onBack: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.header
      className="z-20 shrink-0 border-b border-border bg-transparent"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 800, damping: 25 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-muted/80 transition hover:bg-muted"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </motion.button>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.button
                key="edit"
                onClick={onEdit}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-[0.94] active:brightness-[0.9]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={onCancel}
                  disabled={!!saving}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-muted/70 px-4 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  {t("profile.cancel")}
                </motion.button>
                <motion.button
                  onClick={onSave}
                  disabled={!!saving}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-[filter] hover:brightness-[0.94] active:brightness-[0.9] disabled:cursor-not-allowed disabled:opacity-60"
                  whileHover={{ scale: 1.05 }}
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
