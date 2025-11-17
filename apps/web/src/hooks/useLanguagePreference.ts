"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_LANGUAGE,
  PREFERRED_LANGUAGE_COOKIE,
  SupportedLanguage,
  isSupportedLanguage,
} from "@/i18n/config";

// Cookie helpers
const setCookie = (name: string, value: string, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

export function useLanguagePreference() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  // Initialize language on mount
  useEffect(() => {
    const initLanguage = async () => {
      // 1. Try to get from cookie first (fastest)
      const cookieLang = getCookie(PREFERRED_LANGUAGE_COOKIE);

      if (isSupportedLanguage(cookieLang)) {
        i18n.changeLanguage(cookieLang);
      } else {
        i18n.changeLanguage(DEFAULT_LANGUAGE);
      }

      // 2. If user is logged in, sync with database
      if (user?.preferred_lng) {
        const dbLang = user.preferred_lng;

        // If DB language differs from cookie, update cookie
        if (dbLang !== cookieLang) {
          setCookie(PREFERRED_LANGUAGE_COOKIE, dbLang);
          i18n.changeLanguage(dbLang);
        }
      }
    };

    initLanguage();
  }, [user, i18n]);

  // Change language function
  const changeLanguage = (lang: SupportedLanguage) => {
    // 1. Update i18n
    i18n.changeLanguage(lang);

    // 2. Update cookie
    setCookie(PREFERRED_LANGUAGE_COOKIE, lang);

    // 3. Update database if user is logged in (truly fire and forget)
    if (user) {
      // Use setTimeout to ensure this runs asynchronously without blocking
      setTimeout(() => {
        supabase.from("profiles").update({ preferred_lng: lang });
      }, 0);
    }
  };

  return {
    currentLanguage: i18n.language as "en" | "bg",
    changeLanguage,
  };
}
