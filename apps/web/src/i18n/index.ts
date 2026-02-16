"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/common.json";
import bg from "./locales/bg/common.json";
import {
  DEFAULT_LANGUAGE,
  PREFERRED_LANGUAGE_COOKIE,
  SUPPORTED_LANGUAGES,
} from "./config";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        bg: { translation: bg },
      },
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      detection: {
        order: ["cookie", "navigator"],
        caches: ["cookie"],
        lookupCookie: PREFERRED_LANGUAGE_COOKIE,
        cookieMinutes: 525600, // 1 year
      },
      interpolation: { escapeValue: false },
      returnEmptyString: false,
    });
}

export default i18n;
