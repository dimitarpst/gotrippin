"use client";

import { useEffect, useRef } from "react";
import i18n from "./index";
import {
  DEFAULT_LANGUAGE,
  SupportedLanguage,
  isSupportedLanguage,
  PREFERRED_LANGUAGE_COOKIE,
} from "./config";

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}

const getClientCookieLanguage = (): SupportedLanguage | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(^| )${PREFERRED_LANGUAGE_COOKIE}=([^;]+)`)
  );
  const lang = match?.[2];
  return isSupportedLanguage(lang) ? lang : null;
};

export default function I18nProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: I18nProviderProps) {
  const lastLanguageRef = useRef<string | null>(null);

  const applyLanguage = (language: SupportedLanguage) => {
    if (!i18n.isInitialized) return;
    if (lastLanguageRef.current === language) return;

    i18n.changeLanguage(language);
    lastLanguageRef.current = language;
  };

  // Ensure server and client share the same initial language
  applyLanguage(initialLanguage);

  useEffect(() => {
    applyLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    // After hydration, prefer whatever is stored client-side to keep detector/cookie in sync
    if (typeof window === "undefined") return;
    const cookieLanguage = getClientCookieLanguage();

    applyLanguage(cookieLanguage ?? initialLanguage);
  }, [initialLanguage]);

  return <>{children}</>;
}
