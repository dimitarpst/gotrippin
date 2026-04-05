"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import type { SupportedLanguage } from "@/i18n/config";

export function FooterLanguageMenu() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguagePreference();

  const label = currentLanguage === "bg" ? "Български" : "English";

  const select = (lang: SupportedLanguage) => {
    changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white"
          aria-label={t("landing.footer.language")}
        >
          <Globe className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onClick={() => select("en")} className={currentLanguage === "en" ? "font-semibold" : ""}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => select("bg")} className={currentLanguage === "bg" ? "font-semibold" : ""}>
          Български
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
