"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const LANGUAGE_COOKIE = "preferred_language";

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
      const cookieLang = getCookie(LANGUAGE_COOKIE);

      if (cookieLang && (cookieLang === "en" || cookieLang === "bg")) {
        i18n.changeLanguage(cookieLang);
      }

      // 2. If user is logged in, sync with database
      if (user?.preferred_lng) {
        const dbLang = user.preferred_lng;

        // If DB language differs from cookie, update cookie
        if (dbLang !== cookieLang) {
          setCookie(LANGUAGE_COOKIE, dbLang);
          i18n.changeLanguage(dbLang);
        }
      }
    };

    initLanguage();
  }, [user, i18n]);

  // Change language function
  const changeLanguage = (lang: "en" | "bg") => {
    console.log("🌍 Changing language to:", lang);

    // 1. Update i18n
    i18n.changeLanguage(lang);

    // 2. Update cookie
    setCookie(LANGUAGE_COOKIE, lang);
    console.log("🍪 Cookie updated");

    // 3. Update database if user is logged in (truly fire and forget)
    if (user) {
      console.log("👤 User is logged in, updating database...");
      // Use setTimeout to ensure this runs asynchronously without blocking
      setTimeout(() => {
        supabase
          .from("profiles")
          .update({ preferred_lng: lang })
          .eq("id", user.id)
          .then(({ error }) => {
            if (error) {
              console.error("❌ Database update error:", error);
            } else {
              console.log("✅ Database updated successfully");
            }
          });
      }, 0);
    } else {
      console.log("⚠️ No user logged in, skipping database update");
    }
  };

  return {
    currentLanguage: i18n.language as "en" | "bg",
    changeLanguage,
  };
}
