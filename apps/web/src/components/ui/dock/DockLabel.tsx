"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export function DockLabel({
  children,
  className = "",
  isHovered,
}: {
  children: React.ReactNode;
  className?: string;
  isHovered?: MotionValue<number>;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsub = isHovered.on("change", (val) => setIsVisible(val === 1));
    return () => unsub();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          role="tooltip"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -top-6 px-2 py-[2px] rounded-md text-xs",
            "border border-[color:var(--color-border)]/60",
            "bg-[color-mix(in_oklab,var(--surface)_80%,black_20%)] text-[var(--color-foreground)]",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
