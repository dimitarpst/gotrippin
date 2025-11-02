"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/languageSwitcher";

export default function FloatingHeader() {
  const { t, i18n } = useTranslation();
  const [openMenu, setOpenMenu] = useState<"trips" | "language" | null>(null);
  const [selected, setSelected] =
    useState<"my_trips" | "shared_trips">("my_trips");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { key: "my_trips", label: t("header.my_trips"), icon: MapPin },
    { key: "shared_trips", label: t("header.shared_trips"), icon: User },
  ];

  return (
    <div
      ref={ref}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] z-50"
    >
      <motion.div
        className="relative flex items-center justify-between px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
        }}
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Left side — Trips menu */}
        <div className="relative flex items-center gap-4">
          <button
            onClick={() =>
              setOpenMenu(openMenu === "trips" ? null : "trips")
            }
            className="flex items-center gap-2 text-lg font-semibold text-white/90 hover:text-white transition-colors"
          >
            {t(`header.${selected}`)}
            <ChevronDown
              className={`w-5 h-5 text-white/60 transition-transform ${
                openMenu === "trips" ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {/* Dropdown (Trips) */}
          <AnimatePresence>
            {openMenu === "trips" && (
              <motion.div
                className="absolute top-[calc(100%+0.5rem)] left-0 w-52 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-2xl shadow-[0_4px_40px_rgba(0,0,0,0.4)]"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(25,25,35,0.9), rgba(40,35,50,0.7))",
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {options.map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => {
                      setSelected(key as typeof selected);
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors ${
                      selected === key ? "text-[#ff6b6b]" : ""
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <Icon className="w-4 h-4 text-[#ff6b6b]" />
                    {label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side — Language switcher */}
        <div className="relative flex items-center">
          <LanguageSwitcher
            defaultLanguage={i18n.language as "en" | "bg"}
            isOpen={openMenu === "language"}
            onToggle={() =>
              setOpenMenu(openMenu === "language" ? null : "language")
            }
          />
        </div>
      </motion.div>
    </div>
  );
}
