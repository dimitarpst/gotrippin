"use client"

import type React from "react"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { type ReactNode, useRef } from "react"

interface GlowCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function GlowCard({ children, className = "", onClick }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,107,107,0.15), transparent 40%)`,
          ),
        }}
      />
      {children}
    </motion.div>
  )
}
