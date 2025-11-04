"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  style?: React.CSSProperties;
}

export function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  style,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activate = () => isHovered.set(1);
  const deactivate = () => isHovered.set(0);

  // ✅ explicitly cast inputs in callback, avoiding tuple confusion
  const combinedSize = useTransform([mouseX, isHovered], (values) => {
    const [mouse, hover] = values as [number, number];
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return baseItemSize;

    if (hover === 1) return magnification;

    const center = rect.x + rect.width / 2;
    const distanceToMouse = Math.abs(mouse - center);
    const normalized = Math.max(0, 1 - distanceToMouse / distance);
    return baseItemSize + (magnification - baseItemSize) * normalized;
  }) as MotionValue<number>; // ✅ ensures output motion value typed correctly

  const size = useSpring(combinedSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, ...style }}
      onHoverStart={activate}
      onHoverEnd={deactivate}
      onFocus={activate}
      onBlur={deactivate}
      onClick={onClick}
      onTouchStart={() => (timeoutRef.current = setTimeout(activate, 100))}
      onTouchEnd={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        deactivate();
      }}
      onTouchCancel={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        deactivate();
      }}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl cursor-pointer select-none",
        "bg-[color-mix(in_oklab,var(--surface)_60%,black_40%)] border border-[color:var(--color-border)]/60",
        "shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-all duration-200 ease-out",
        "focus:outline-none",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, {
              isHovered,
            })
          : child
      )}
    </motion.div>
  );
}
