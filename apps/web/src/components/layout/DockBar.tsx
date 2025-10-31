"use client";

import { motion } from "framer-motion";
import Dock from "@/components/ui/dock";
import { Home, Compass, Plus, Settings, User } from "lucide-react";

const baseClass =
  "bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300";
const accentClass =
  "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent)]/80 shadow-[0_0_20px_rgba(255,107,107,0.5)] transition-all duration-300";

const icons = {
  Home,
  Explore: Compass,
  AddTrip: Plus,
  Settings,
  Profile: User,
};

export default function DockBar() {
  const items = Object.entries(icons).map(([label, Icon]) => ({
    icon: (
      <Icon
        className={`w-6 h-6 ${
          label === "AddTrip" ? "text-[var(--color-accent-foreground)]" : ""
        }`}
      />
    ),
    label: label === "AddTrip" ? "Add Trip" : label,
    onClick: () => {},
    className: label === "AddTrip" ? accentClass : baseClass,
  }));

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
