"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ArrowRight, X, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface FlightSearchProps {
  tripId: string
  onBack: () => void
}

export default function FlightSearch({ tripId, onBack }: FlightSearchProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showForwardCard, setShowForwardCard] = useState(true)

  const handleSearch = () => {
    // Navigate to flight details with a hardcoded flight ID
    router.push(`/trips/${tripId}/activity/flight/flight-1`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <motion.div
        className="sticky top-0 z-10 border-b border-white/[0.08] px-6 py-4"
        style={{ backgroundColor: "var(--surface)" }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            Cancel
          </button>
          <h1 className="text-lg font-semibold text-white">Search Flight</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-4">
        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Input
            type="text"
            placeholder="Airport, Airline or Flight Number (e.g AA107)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
            className="w-full pl-4 pr-4 py-3 rounded-xl text-white focus:ring-2 transition-all duration-200"
            style={
              {
                backgroundColor: "var(--surface-alt)",
                borderColor: "var(--border)",
                "--tw-ring-color": "rgba(255, 107, 107, 0.4)",
              } as any
            }
          />
        </motion.div>

        {/* Forward Reservations Card */}
        {showForwardCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              className="rounded-2xl p-5 shadow-card border-white/[0.08] relative overflow-hidden"
              style={{
                backgroundColor: "#D2691E",
                background: "linear-gradient(135deg, #D2691E 0%, #CD853F 100%)",
              }}
            >
              <button
                onClick={() => setShowForwardCard(false)}
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
                  <Send className="w-6 h-6 text-white rotate-[-45deg]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-base mb-1">Forward Reservations</h3>
                  <p className="text-white/90 text-sm mb-4">
                    Forward ticket reservations, and save in your itinerary automatically.
                  </p>
                  <motion.button
                    onClick={() => {
                      // Navigate to automation page (to be implemented later)
                      // For now, just close the card
                      setShowForwardCard(false)
                    }}
                    className="text-white font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Set Up Now
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search Results Placeholder */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <motion.button
              onClick={handleSearch}
              className="w-full border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-card transition-all"
              style={{ backgroundColor: "var(--surface)" }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "#FF6B6B20",
                    border: "1px solid #FF6B6B40",
                  }}
                >
                  <Search className="w-5 h-5" style={{ color: "#FF6B6B" }} />
                </div>
                <div className="text-left">
                  <p className="text-white text-base font-medium">Flight {searchQuery}</p>
                  <p className="text-white/60 text-sm">Select to add details</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

