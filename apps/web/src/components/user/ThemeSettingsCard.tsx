"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system" as const, icon: Monitor, labelKey: "profile.theme_system" },
  { value: "light" as const, icon: Sun, labelKey: "profile.theme_light" },
  { value: "dark" as const, icon: Moon, labelKey: "profile.theme_dark" },
];

export default function ThemeSettingsCard() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = mounted ? (theme ?? "system") : null;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", stiffness: 800, damping: 25, delay: 0.18 }}
    >
      <div className="glass-panel relative overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3 sm:pl-4 sm:pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sun className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-foreground">{t("profile.theme_title")}</h3>
            <p className="text-xs leading-snug text-muted-foreground">{t("profile.theme_description")}</p>
          </div>
        </div>

        <div
          className="flex gap-1.5 sm:shrink-0"
          role="radiogroup"
          aria-label={t("profile.theme_title")}
        >
          {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
            const isSelected = mounted && selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!mounted}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors sm:flex-initial sm:min-w-[4.25rem]",
                  "cursor-pointer disabled:cursor-wait disabled:opacity-70",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span className="truncate">{t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
