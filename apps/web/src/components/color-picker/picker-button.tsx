"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PickerButtonProps {
  icon: React.ReactNode;
  isOpen?: boolean;
  onClick?: () => void;
  label?: string;
  /** Required when `label` is omitted (icon-only trigger). */
  "aria-label"?: string;
  className?: string;
}

export const PickerButton = forwardRef<HTMLButtonElement, PickerButtonProps>(
  function PickerButton(
    { icon, isOpen = false, onClick, label, "aria-label": ariaLabel, className },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer transition text-sm border-0 text-white/90",
          label
            ? "items-center gap-2 px-4 py-2"
            : "items-center justify-center p-2.5 min-h-10 min-w-10 shrink-0",
          isOpen ? "text-white bg-white/15" : "text-white/90",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
      >
        {icon}
        {label ? <span>{label}</span> : null}
      </motion.button>
    );
  }
);
