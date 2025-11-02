"use client";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function AuthHeader({ isLogin }: { isLogin: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-8">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold text-white mb-2"
      >
        {t("app.title")}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-[var(--muted)]"
      >
        {isLogin ? t("app.welcome_back") : t("app.start_journey")}
      </motion.p>
    </div>
  );
}
