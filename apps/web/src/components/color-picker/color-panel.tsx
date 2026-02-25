"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Tabs, type ColorPickerTab } from "./tabs";
import { PresetView } from "./preset-view";
import { CustomView } from "./custom-view";

interface ColorPanelProps {
  selectedTab: ColorPickerTab;
  onTabChange: (tab: ColorPickerTab) => void;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onSave: () => void;
}

export function ColorPanel({
  selectedTab,
  onTabChange,
  selectedColor,
  onSelectColor,
  onSave,
}: ColorPanelProps) {
  return (
    <>
      <Tabs selectedTab={selectedTab} onTabChange={onTabChange} />
      <AnimatePresence mode="wait">
        {selectedTab === "Preset" ? (
          <motion.div
            key="preset"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0.3 }}
          >
            <PresetView
              selectedColor={selectedColor}
              onSelectColor={onSelectColor}
              onSave={onSave}
            />
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0.3 }}
          >
            <CustomView
              selectedColor={selectedColor}
              onSelectColor={onSelectColor}
              onSave={onSave}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
