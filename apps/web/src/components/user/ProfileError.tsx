"use client";

import { useTranslation } from "react-i18next";

export default function ProfileError({
  message,
  clearError,
}: {
  message: string;
  clearError?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 text-center text-sm text-red-400">
      {message}{" "}
      {clearError && (
        <button onClick={clearError} className="underline">
          {t("profile.dismiss")}
        </button>
      )}
    </div>
  );
}
