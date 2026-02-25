"use client";

import { motion } from "framer-motion";

const TABS = ["Preset", "Custom"] as const;
export type ColorPickerTab = (typeof TABS)[number];

interface TabsProps {
  selectedTab: ColorPickerTab;
  onTabChange: (tab: ColorPickerTab) => void;
}

export function Tabs({ selectedTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            selectedTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {selectedTab === tab && (
            <motion.div
              layoutId="underline"
              className="absolute inset-0 rounded-md bg-muted"
              transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
