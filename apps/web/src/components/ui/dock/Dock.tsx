"use client";

import React, { useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, type SpringOptions } from "framer-motion";
import { cn } from "@/lib/utils";
import { DockItem } from "./DockItem";
import { DockIcon } from "./DockIcon";
import { DockLabel } from "./DockLabel";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

export function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 75,
  dockHeight = 256,
  baseItemSize = 50,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height }} className="flex w-full items-center justify-center overflow-hidden">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        role="toolbar"
        aria-label="Application dock"
        style={{ height: panelHeight }}
        className={cn(
          "absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-4 px-3 pb-2",
          "rounded-2xl border border-[color:var(--color-border)]/60",
          "backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
          "bg-[color-mix(in_oklab,var(--surface)_70%,black_30%)]",
          className
        )}
      >
        {items.map((item, i) => (
          <DockItem
            key={i}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            style={item.style}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
