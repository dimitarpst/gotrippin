"use client";

import {
  motion,
  AnimatePresence,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from "framer-motion";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  Children,
  cloneElement,
} from "react";
import { cn } from "@/lib/utils";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
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

/* ───────────────────────────────────────────────
   Dock Item (icon + label)
──────────────────────────────────────────────── */
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // handle hover (desktop) & touch (mobile)
  const activate = () => isHovered.set(1);
  const deactivate = () => isHovered.set(0);

  // Combine desktop hover distance + touch press logic
  const combinedSize = useTransform(
    [mouseX, isHovered],
    (values) => {
      const [mouse, hover] = values as [number, number]; // 👈 Cast fixes TS type
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return baseItemSize;

      if (hover === 1) return magnification;

      const center = rect.x + rect.width / 2;
      const distanceToMouse = Math.abs(mouse - center);
      const normalized = Math.max(0, 1 - distanceToMouse / distance);
      return baseItemSize + (magnification - baseItemSize) * normalized;
    }
  );


  const size = useSpring(combinedSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={activate}
      onHoverEnd={deactivate}
      onFocus={activate}
      onBlur={deactivate}
      onClick={onClick}
      onTouchStart={() => {
        timeoutRef.current = setTimeout(activate, 100);
      }}
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
        "bg-[color-mix(in_oklab,var(--surface)_80%,black_20%)] border border-[color:var(--color-border)]/60",
        "shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-all duration-200 ease-out",
        "focus:outline-none",
        className
      )}
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(
              child as React.ReactElement<{ isHovered?: MotionValue<number> }>,
              { isHovered }
            )
          : child
      )}
    </motion.div>
  );
}


/* ───────────────────────────────────────────────
   Dock Label
──────────────────────────────────────────────── */
type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          role="tooltip"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -top-6 px-2 py-[2px] rounded-md text-xs",
            "border border-[color:var(--color-border)]/60",
            "bg-[color-mix(in_oklab,var(--surface)_80%,black_20%)] text-[var(--color-foreground)]",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────────────────────────
   Dock Icon
──────────────────────────────────────────────── */
type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = "" }: DockIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-full h-full text-[var(--color-foreground)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Dock Root
──────────────────────────────────────────────── */
export default function Dock({
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
    <motion.div
      style={{ height }}
      className="flex w-full items-center justify-center overflow-hidden"
    >
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
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
