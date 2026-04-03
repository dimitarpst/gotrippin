"use client";

import { motion } from "framer-motion";
import { Dock } from "@/components/ui/dock";

import { Home, Compass, Plus, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAvatarUrl } from "@/lib/avatar";

const baseClass =
  "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300";
/** Dock FAB: logo coral (#ff7670) + shared hover token */
const accentClass =
  "bg-[#ff7670] text-white hover:bg-[var(--brand-coral-hover)] shadow-md shadow-[0_4px_20px_rgba(255,118,112,0.34)] transition-all duration-300 dark:bg-[#ff7670] dark:hover:bg-[var(--brand-coral-hover)] dark:shadow-[0_0_24px_rgba(255,118,112,0.45)]";

interface DockBarProps {
  onCreateTrip?: () => void;
}

export default function DockBar({ onCreateTrip }: DockBarProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  // Main dock icons
  const icons = [
    { key: "home", icon: Home },
    { key: "explore", icon: Compass },
    { key: "add_trip", icon: Plus },
    { key: "ai", icon: Bot },
  ];

  // Map standard icons
  const items = icons.map(({ key, icon: Icon }) => ({
    icon: (
      <Icon className={`h-6 w-6 ${key === "add_trip" ? "text-white" : ""}`} />
    ),
    label: t(`dock.${key}`),
    onClick: () => {
      if (key === "add_trip" && onCreateTrip) {
        onCreateTrip();
      } else if (key === "explore") {
        router.push("/explore");
      } else if (key === "ai") {
        router.push("/ai");
      }
    },
    className: key === "add_trip" ? accentClass : baseClass,
  }));

  // Avatar - always show, but style changes based on login
  const avatarLetter = user
    ? user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
      user?.email?.[0]?.toUpperCase() ||
      "U"
    : "U";

  const avatarColor = user?.avatar_color || "var(--color-muted)";
  const avatarUrl = resolveAvatarUrl(user?.avatar_url);

  items.push({
    icon: (
      <div className="relative w-8 h-8 rounded-full overflow-hidden transition-transform hover:scale-105">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile avatar"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector(
                  ".avatar-fallback",
                ) as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback text-sm font-bold text-white select-none w-full h-full rounded-full flex items-center justify-center absolute inset-0 ${
            avatarUrl ? "hidden" : "flex"
          }`}
          style={{
            backgroundColor: avatarColor,
            boxShadow: user ? `0 0 10px ${avatarColor}66` : "none",
            opacity: user ? 1 : 0.5,
          }}
        >
          {avatarLetter}
        </div>
      </div>
    ),
    label: t("dock.profile"),
    onClick: () => router.push("/user"),
    className: baseClass,
  });

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 24 },
      }}
    >
      <Dock
        items={items}
        className="gap-2 px-5 py-3 transition-all duration-500 hover:shadow-lg dark:hover:shadow-[0_8px_48px_rgba(255,118,112,0.25)]"
      />
    </motion.div>
  );
}
