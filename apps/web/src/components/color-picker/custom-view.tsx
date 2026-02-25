"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { SaveButton } from "./save-button";
import styles from "./custom-view.module.css";

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ].join(", ");
}

interface CustomViewProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onSave: () => void;
}

export function CustomView({
  selectedColor,
  onSelectColor,
  onSave,
}: CustomViewProps) {
  const hexValue = selectedColor || "#000000";
  const rgbValue = hexToRgb(hexValue);

  return (
    <div className="space-y-4">
      <div className={styles.wrapper}>
        <HexColorPicker
          color={hexValue}
          onChange={onSelectColor}
          className="rounded-xl"
        />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hex</label>
          <HexColorInput
            color={hexValue}
            onChange={onSelectColor}
            prefixed
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">RGB</label>
          <input
            type="text"
            readOnly
            value={rgbValue}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground focus:outline-none cursor-default"
          />
        </div>
      </div>
      <SaveButton
        color={selectedColor}
        onSave={onSave}
        disabled={!selectedColor}
      />
    </div>
  );
}
