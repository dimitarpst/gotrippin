"use client";

import { useState, useCallback, useEffect } from "react";
import { Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PickerButton } from "./picker-button";
import { ColorPanel } from "./color-panel";
import type { ColorPickerTab } from "./tabs";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  icon,
  label,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ColorPickerTab>("Preset");
  const [selectedColor, setSelectedColor] = useState(value || "#1a1a2e");

  useEffect(() => {
    if (open) setSelectedColor(value || "#1a1a2e");
  }, [open, value]);

  const handleSave = useCallback(() => {
    onChange(selectedColor);
    setOpen(false);
  }, [selectedColor, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <PickerButton
          icon={icon ?? <Palette className="w-4 h-4" />}
          isOpen={open}
          label={label}
        />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-72">
        <ColorPanel
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          onSave={handleSave}
        />
      </PopoverContent>
    </Popover>
  );
}
