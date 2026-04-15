"use client";

import { motion } from "framer-motion";

export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-[var(--color-accent)]"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 1.2, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
