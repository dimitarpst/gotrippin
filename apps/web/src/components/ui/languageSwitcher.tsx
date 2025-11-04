"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Language = "en" | "bg";

interface LanguageSwitcherProps {
  defaultLanguage?: Language;
  isOpen?: boolean;
  onToggle?: () => void;
}

const UKFlag = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
    <rect width="32" height="24" rx="3" fill="#012169" />
    <path d="M0 0L32 24M32 0L0 24" stroke="white" strokeWidth="3" />
    <path d="M0 0L32 24M32 0L0 24" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M16 0V24M0 12H32" stroke="white" strokeWidth="4" />
    <path d="M16 0V24M0 12H32" stroke="#C8102E" strokeWidth="2.5" />
  </svg>
);

const BulgariaFlag = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
    <rect width="32" height="24" rx="3" fill="#D62612" />
    <rect width="32" height="8" rx="3" fill="white" />
    <rect y="8" width="32" height="8" fill="#00966E" />
    <rect y="16" width="32" height="8" fill="#D62612" />
  </svg>
);

const languages = {
  en: { flag: UKFlag, name: "English" },
  bg: { flag: BulgariaFlag, name: "Български" },
};

export function LanguageSwitcher({
  defaultLanguage = "en",
  isOpen = false,
  onToggle,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(
    (i18n.language as Language) || defaultLanguage
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen && onToggle) onToggle(); // close if clicked outside
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    if (onToggle) onToggle(); // close menu after selection
  };

  const CurrentFlag = languages[language as keyof typeof languages]?.flag || UKFlag;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <motion.button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-center w-12 h-10 rounded-xl",
          "border border-white/10",
          "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
          "backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
          "hover:border-[var(--color-accent)]/60 hover:shadow-[0_0_20px_rgba(255,107,107,0.3)]",
          "transition-all duration-300"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <CurrentFlag />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={cn(
              "absolute top-full mt-2 right-0",
              "w-40 rounded-2xl border border-white/10 overflow-hidden",
              "backdrop-blur-2xl shadow-[0_4px_40px_rgba(0,0,0,0.4)]",
              "bg-[linear-gradient(160deg,rgba(25,25,35,0.9),rgba(40,35,50,0.7))]",
              "z-50"
            )}
          >
            {Object.entries(languages).map(([code, { flag: Flag, name }]) => (
              <motion.button
                key={code}
                onClick={() => handleSelect(code as Language)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  language === code
                    ? "bg-white/10 text-[#ff6b6b]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
                whileHover={{ x: 4 }}
              >
                <Flag />
                <span>{name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
