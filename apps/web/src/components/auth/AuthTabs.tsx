"use client";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function AuthTabs({
  isLogin,
  setIsLogin,
}: {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-xl">
      <button
        onClick={() => setIsLogin(true)}
        className="flex-1 relative py-2.5 text-sm font-medium transition-colors duration-200"
      >
        {isLogin && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-[var(--accent)] rounded-lg"
            transition={{ type: "spring", stiffness: 600, damping: 25 }}
          />
        )}
        <span
          className={`relative z-10 ${
            isLogin ? "text-white" : "text-[var(--muted)]"
          }`}
        >
          {t("auth.sign_in")}
        </span>
      </button>
      <button
        onClick={() => setIsLogin(false)}
        className="flex-1 relative py-2.5 text-sm font-medium transition-colors duration-200"
      >
        {!isLogin && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-[var(--accent)] rounded-lg"
            transition={{ type: "spring", stiffness: 600, damping: 25 }}
          />
        )}
        <span
          className={`relative z-10 ${
            !isLogin ? "text-white" : "text-[var(--muted)]"
          }`}
        >
          {t("auth.create_account")}
        </span>
      </button>
    </div>
  );
}
