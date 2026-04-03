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
    <div className="mt-6 text-center text-sm text-destructive">
      {message}{" "}
      {clearError && (
        <button type="button" onClick={clearError} className="underline text-muted-foreground hover:text-foreground">
          {t("profile.dismiss")}
        </button>
      )}
    </div>
  );
}
