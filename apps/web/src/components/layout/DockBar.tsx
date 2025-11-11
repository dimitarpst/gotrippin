"use client";

import { motion } from "framer-motion";
import { Dock } from "@/components/ui/dock";

import { Home, Compass, Plus, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const baseClass =
  "bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300";
const accentClass =
  "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent)]/80 shadow-[0_0_20px_rgba(255,107,107,0.5)] transition-all duration-300";

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
    { key: "settings", icon: Settings },
  ];

  // Map standard icons
  const items = icons.map(({ key, icon: Icon }) => ({
    icon: (
      <Icon
        className={`w-6 h-6 ${
          key === "add_trip" ? "text-[var(--color-accent-foreground)]" : ""
        }`}
      />
    ),
    label: t(`dock.${key}`),
    onClick: () => {
      if (key === "add_trip" && onCreateTrip) {
        onCreateTrip();
      } else if (key === "settings") {
        router.push("/settings");
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
  const avatarUrl = user?.avatar_url;

  items.push({
    icon: (
      <div className="relative w-8 h-8 rounded-full overflow-hidden transition-transform hover:scale-105">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback text-sm font-bold text-white select-none w-full h-full rounded-full flex items-center justify-center absolute inset-0 ${avatarUrl ? 'hidden' : 'flex'}`}
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
        transition: { type: 'spring', stiffness: 260, damping: 24 },
      }}
    >
      <Dock
        items={items}
        className="
          flex gap-2 
          rounded-2xl px-5 py-3
          backdrop-blur-xl
          border border-white/10
          bg-gradient-to-br from-white/10 via-white/5 to-transparent
          shadow-[0_8px_32px_rgba(0,0,0,0.35)]
          transition-all duration-500
          hover:shadow-[0_8px_48px_rgba(255,107,107,0.25)]
        "
      />
    </motion.div>
  );
}
