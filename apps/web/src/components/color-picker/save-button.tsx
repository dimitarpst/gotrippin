"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SaveButtonProps {
  color: string;
  onSave: () => void;
  disabled?: boolean;
}

export function SaveButton({
  color,
  onSave,
  disabled = false,
}: SaveButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onSave}
      disabled={disabled}
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={
        color
          ? {
              backgroundColor: color,
              color: isLight(color) ? "hsl(var(--foreground))" : "#fff",
            }
          : undefined
      }
    >
      <Check className="w-4 h-4" />
      Save
    </motion.button>
  );
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
