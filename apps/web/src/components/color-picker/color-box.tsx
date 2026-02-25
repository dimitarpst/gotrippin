"use client";

import { motion } from "framer-motion";

interface ColorBoxProps {
  children: React.ReactNode;
}

export function ColorBox({ children }: ColorBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 w-[280px] rounded-2xl border border-white/8 shadow-2xl p-4 text-white overflow-hidden"
      style={{ background: "rgba(23, 19, 26, 0.8)", backdropFilter: "blur(20px)" }}
    >
      <div className="relative">{children}</div>
    </motion.div>
  );
}
