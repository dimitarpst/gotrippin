import type { SupportedLanguage } from "@/i18n/config";
import bgCommon from "@/i18n/locales/bg/common.json";
import enCommon from "@/i18n/locales/en/common.json";

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingFaqCopy = {
  title: string;
  items: LandingFaqItem[];
};

export function getLandingFaq(lang: SupportedLanguage): LandingFaqCopy {
  const faq = lang === "bg" ? bgCommon.landing.faq : enCommon.landing.faq;
  return {
    title: faq.title,
    items: faq.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  };
}
