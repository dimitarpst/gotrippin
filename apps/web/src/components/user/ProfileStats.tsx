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
          className="md:min-w-0 md:flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-6 text-center">
            <Icon className="mb-3 h-8 w-8 text-primary" />
            <div className="mb-1 text-4xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
