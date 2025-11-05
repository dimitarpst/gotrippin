"use client"

import React, { type PropsWithChildren, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

export interface DockProps extends PropsWithChildren {
  className?: string
  iconSize?: number
  iconMagnification?: number
  iconDistance?: number
  direction?: "top" | "middle" | "bottom"
}

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    { className, children, iconSize = 48, iconMagnification = 64, iconDistance = 140, direction = "bottom", ...props },
    ref,
  ) => {
    const mouseX = useMotionValue(Number.POSITIVE_INFINITY)

    const renderChildren = () => {
      return React.Children.map(children, (child: any) => {
        return React.cloneElement(child, {
          mouseX: mouseX,
          iconMagnification: iconMagnification,
          iconDistance: iconDistance,
          iconSize: iconSize,
        })
      })
    }

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
        {...props}
        className={cn(
          "mx-auto flex h-16 items-end gap-4 rounded-2xl border border-white/[0.08] px-4 pb-2",
          "backdrop-blur-xl shadow-2xl",
          className,
        )}
        style={{ background: "var(--surface)" }}
      >
        {renderChildren()}
      </motion.div>
    )
  },
)

Dock.displayName = "Dock"

export interface DockIconProps {
  size?: number
  magnification?: number
  distance?: number
  mouseX?: any
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export const DockIcon = ({
  size,
  magnification = 64,
  distance = 140,
  mouseX,
  className,
  children,
  onClick,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [size || 48, magnification, size || 48])

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn("flex aspect-square cursor-pointer items-center justify-center bg-transparent", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}

DockIcon.displayName = "DockIcon"
