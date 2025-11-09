"use client";

import { motion } from "framer-motion";
import { Plane, Globe, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfileStats() {
  const { t } = useTranslation();

  const items = [
    { icon: Plane, label: t("profile.trips_completed"), value: 12 },
    { icon: Globe, label: t("profile.countries_visited"), value: 8 },
    { icon: Star, label: t("profile.days_traveling"), value: 156 },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {items.map(({ icon: Icon, label, value }, i) => (
        <motion.div
          key={label}
          className="rounded-2xl p-6 border border-white/[0.08] flex flex-col items-center justify-center text-center"
          style={{
            background: "rgba(23, 19, 26, 0.6)",
            backdropFilter: "blur(20px)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Icon className="w-8 h-8 mb-3" style={{ color: "#ff6b6b" }} />
          <div className="text-4xl font-bold mb-1 text-white">{value}</div>
          <div className="text-sm text-white/60">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}
