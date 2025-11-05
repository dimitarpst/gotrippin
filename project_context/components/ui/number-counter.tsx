"use client"

import { motion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberCounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function NumberCounter({ value, onChange, min = 0, max = 99, label, className }: NumberCounterProps) {
  const increment = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const decrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && <span className="text-white font-medium flex-1">{label}</span>}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={decrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
          whileHover={{ scale: value > min ? 1.05 : 1 }}
          whileTap={{ scale: value > min ? 0.95 : 1 }}
        >
          <Minus className="w-4 h-4 text-white" />
        </motion.button>

        <motion.div
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-12 text-center"
        >
          <span className="text-2xl font-bold text-white">{value}</span>
        </motion.div>

        <motion.button
          onClick={increment}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
          whileHover={{ scale: value < max ? 1.05 : 1 }}
          whileTap={{ scale: value < max ? 0.95 : 1 }}
        >
          <Plus className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </div>
  )
}
