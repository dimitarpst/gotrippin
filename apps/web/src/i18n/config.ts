export const SUPPORTED_LANGUAGES = ["en", "bg"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const PREFERRED_LANGUAGE_COOKIE = "preferred_language";

export const isSupportedLanguage = (
  value: string | undefined | null
): value is SupportedLanguage =>
  Boolean(
    value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
  );

