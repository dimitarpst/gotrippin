"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, User, ChevronDown } from "lucide-react"

export default function FloatingHeader() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("My Trips")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const options = [
    { label: "My Trips", icon: MapPin },
    { label: "Friends’ Trips", icon: User },
  ]

  return (
<div
  ref={ref}
  className="fixed top-6 left-1/2 -translate-x-1/2 w-[75%] z-50"
>
  <motion.div
    className="relative w-full flex items-center justify-between px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    style={{
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
    }}
    initial={{ opacity: 0, y: -20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  >
    {/* left side */}
    <button
      onClick={() => setOpen((p) => !p)}
      className="flex items-center gap-2 text-lg font-semibold text-white/90 hover:text-white transition-colors"
    >
      {selected}
      <ChevronDown
        className={`w-5 h-5 text-white/60 transition-transform ${
          open ? "rotate-180" : "rotate-0"
        }`}
      />
    </button>

    {/* right side (optional future stuff) */}
    <div className="flex items-center gap-3">
      {/* placeholder for profile icon or settings later */}
    </div>

    {/* dropdown goes here (same as before) */}
    <AnimatePresence>
      {open && (
          <motion.div
            className="absolute left-8 top-[calc(100%+0.5rem)] w-52 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-2xl shadow-[0_4px_40px_rgba(0,0,0,0.4)]"
            style={{
              background:
                "linear-gradient(160deg, rgba(25,25,35,0.9), rgba(40,35,50,0.7))",
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {[
              { label: "My Trips", icon: MapPin },
              { label: "Friends’ Trips", icon: User },
            ].map(({ label, icon: Icon }) => (
              <motion.button
                key={label}
                onClick={() => {
                  setSelected(label)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors ${
                  selected === label ? "text-[#ff6b6b]" : ""
                }`}
                whileHover={{ x: 4 }}
              >
                <Icon className="w-4 h-4 text-[#ff6b6b]" />
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>

  )
}
