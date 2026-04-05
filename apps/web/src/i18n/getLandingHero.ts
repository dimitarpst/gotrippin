import type { SupportedLanguage } from "@/i18n/config";
import bgCommon from "@/i18n/locales/bg/common.json";
import enCommon from "@/i18n/locales/en/common.json";

export type LandingHeroCopy = (typeof enCommon)["landing"]["hero"];

export function getLandingHero(lang: SupportedLanguage): LandingHeroCopy {
  if (lang === "bg") {
    return bgCommon.landing.hero as LandingHeroCopy;
  }
  return enCommon.landing.hero;
}
