"use client";

import { motion } from "framer-motion";
import { Hex } from "./hex";
import { SaveButton } from "./save-button";
import { PRESET_COLORS } from "./preset-colors";

interface PresetViewProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onSave: () => void;
}

export function PresetView({
  selectedColor,
  onSelectColor,
  onSave,
}: PresetViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onSelectColor(hex)}
            className="relative w-10 h-10 rounded-full border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform hover:scale-110"
            style={{ backgroundColor: hex }}
            aria-label={`Select color ${hex}`}
          >
            {selectedColor === hex && (
              <motion.div
                layoutId="color-ring"
                initial={false}
                className="absolute -inset-[3px] rounded-full border-2 border-primary"
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Hex color={selectedColor} />
        <SaveButton
          color={selectedColor}
          onSave={onSave}
          disabled={!selectedColor}
        />
      </div>
    </div>
  );
}
