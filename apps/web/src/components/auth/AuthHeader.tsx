"use client";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";

export function AuthHeader({ isLogin }: { isLogin: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex justify-center mb-4"
      >
        <Logo className="h-12 w-auto" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground"
      >
        {isLogin ? t("app.welcome_back") : t("app.start_journey")}
      </motion.p>
    </div>
  );
}
