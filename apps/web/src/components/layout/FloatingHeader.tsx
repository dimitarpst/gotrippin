"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/languageSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TripsListScope = "my_trips" | "shared_trips";

export interface FloatingHeaderProps {
  /** `fixed` = overlay header (e.g. explore). `inline` = in document flow, scrolls with page (trips list). */
  variant?: "fixed" | "inline";
  /** When `false`, the bar stays visible while scrolling (e.g. trips dashboard). Default `true`. */
  hideOnScroll?: boolean;
  /** Controlled My / Shared selection (use with `onTripsScopeChange`). */
  tripsScope?: TripsListScope;
  onTripsScopeChange?: (scope: TripsListScope) => void;
  /** Compact search in the header toolbar (e.g. trips dashboard). */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export default function FloatingHeader({
  variant = "fixed",
  hideOnScroll = true,
  tripsScope,
  onTripsScopeChange,
  search,
}: FloatingHeaderProps) {
  const isInline = variant === "inline";
  const { t, i18n } = useTranslation();
  const [internalScope, setInternalScope] = useState<TripsListScope>("my_trips");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const scopeControlled = onTripsScopeChange !== undefined;
  const showTripScopeBar = scopeControlled || tripsScope !== undefined;
  const selected: TripsListScope =
    scopeControlled && tripsScope !== undefined ? tripsScope : internalScope;

  const setScope = (next: TripsListScope) => {
    if (scopeControlled) {
      onTripsScopeChange?.(next);
    } else {
      setInternalScope(next);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleLanguageMenu = useCallback(() => {
    setLanguageOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!hideOnScroll || isInline) {
      setIsHidden(false);
      return;
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollThreshold = 50;

      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      if (scrollingDown && currentScrollY > 100) {
        setIsHidden(true);
      } else if (!scrollingDown || currentScrollY <= 100) {
        setIsHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScroll, isInline]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setLanguageOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scopeOptions: { key: TripsListScope; label: string }[] = [
    { key: "my_trips", label: t("header.my_trips") },
    { key: "shared_trips", label: t("header.shared_trips") },
  ];

  if (!mounted) {
    return (
      <div
        className={cn(
          "opacity-0",
          isInline ? "h-0 w-full" : "fixed top-6 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8",
        )}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full justify-center",
        isInline
          ? "relative z-30 px-4 pt-4 sm:px-6 lg:px-8"
          : "fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8",
      )}
    >
      <motion.div
        className={cn(
          "relative w-full max-w-7xl overflow-visible rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-2.5",
          /* Match Dock.tsx frosted glass — no overflow clipping (avoids bogus inner scrollbars) */
          "border-border/40 bg-gradient-to-br from-card/50 via-card/22 to-card/10 backdrop-blur-2xl",
          "dark:border-white/15 dark:from-white/[0.14] dark:via-white/[0.07] dark:to-transparent",
        )}
        initial={{ opacity: 0, y: isInline ? 0 : -12 }}
        animate={{
          opacity: isInline ? 1 : hideOnScroll && isHidden ? 0 : 1,
          y: isInline ? 0 : hideOnScroll && isHidden ? -12 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/*
          Mobile: [ My | Shared ]····[ moon | flag ]
                [ search full width ]
          sm+:   [ My | Shared ] [ search flex-1 ] [ moon | flag ]  (single row)
        */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          {showTripScopeBar ? (
            <div
              className="inline-flex max-w-full shrink-0 rounded-full bg-muted/50 p-0.5 dark:bg-white/[0.08]"
              role="tablist"
              aria-label={t("header.trip_scope_label", { defaultValue: "Trip list" })}
            >
              {scopeOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected === key}
                  onClick={() => setScope(key)}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                    selected === key
                      ? "bg-background text-foreground shadow-sm dark:bg-white/[0.12] dark:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {search ? (
            <div className="relative order-4 min-w-0 w-full sm:order-2 sm:flex-1 sm:w-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? t("trips.search_placeholder", "Search trips...")}
                className="h-9 w-full rounded-full border border-border/50 bg-muted/30 pl-8 pr-3 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#ff7670]/40 dark:border-white/10 dark:bg-white/[0.06]"
                aria-label={search.placeholder ?? t("trips.search_placeholder", "Search trips...")}
              />
            </div>
          ) : null}

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1 sm:order-3 sm:ml-0">
            <ThemeToggle className="h-9 w-9 shrink-0 rounded-full border-0 hover:bg-muted/80 dark:hover:bg-white/10" />
            <LanguageSwitcher
              compact
              defaultLanguage={(i18n.language?.split("-")[0] as "en" | "bg") || "en"}
              isOpen={languageOpen}
              onToggle={toggleLanguageMenu}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
