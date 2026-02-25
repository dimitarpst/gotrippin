"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PickerButtonProps {
  icon: React.ReactNode;
  isOpen?: boolean;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export const PickerButton = forwardRef<HTMLButtonElement, PickerButtonProps>(
  function PickerButton(
    { icon, isOpen = false, onClick, label, className },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer transition text-sm border-0",
          isOpen ? "text-white" : "text-white/80",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {icon}
        {label ? <span>{label}</span> : null}
      </motion.button>
    );
  }
);
