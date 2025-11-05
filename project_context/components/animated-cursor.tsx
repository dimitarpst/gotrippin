"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export default function AnimatedCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
      setIsVisible(true)
    }

    window.addEventListener("mousemove", moveCursor)
    return () => window.removeEventListener("mousemove", moveCursor)
  }, [cursorX, cursorY])

  if (!isVisible) return null

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          background: "radial-gradient(circle, rgba(255,107,107,0.6) 0%, rgba(255,107,107,0) 70%)",
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-50"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          left: 13,
          top: 13,
          background: "var(--accent)",
        }}
      />
    </>
  )
}
