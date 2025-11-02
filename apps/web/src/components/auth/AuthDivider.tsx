"use client";
import { useTranslation } from "react-i18next";

export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="relative my-8 flex items-center">
      <div className="flex-grow border-t border-white/15" />
      <span className="mx-4 text-sm text-white/60 backdrop-blur-sm px-3 rounded-md">
        {t("auth.or_continue_with")}
      </span>
      <div className="flex-grow border-t border-white/15" />
    </div>
  );
}
