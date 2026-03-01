"use client";

import { motion } from "framer-motion";

export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <motion.span
        className="size-2.5 rounded-full bg-[var(--color-accent)]/80"
        animate={{
          opacity: [0.4, 1, 0.4],
          y: [0, -4, 0],
        }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="size-2.5 rounded-full bg-[var(--color-accent)]/80"
        animate={{
          opacity: [0.4, 1, 0.4],
          y: [0, -4, 0],
        }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="size-2.5 rounded-full bg-[var(--color-accent)]/80"
        animate={{
          opacity: [0.4, 1, 0.4],
          y: [0, -4, 0],
        }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  );
}
