"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plane, Calendar, Clock, FileText, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FlightEditorProps {
  tripId: string
  flightId?: string
  onBack: () => void
  onSave?: () => void
}

export default function FlightEditor({ tripId, flightId, onBack, onSave }: FlightEditorProps) {
  // Hardcoded data for visual tweaking
  const [departure, setDeparture] = useState({ code: "BOJ", date: "26 Oct", time: "10:30 AM" })
  const [arrival, setArrival] = useState({ code: "LCA", date: "26 Oct", time: "12:45 PM" })

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
          <h1 className="text-lg font-semibold text-white">Flight Details</h1>
          <button
            type="button"
            onClick={onSave ?? onBack}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Save
          </button>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-4">
        {/* Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="rounded-2xl p-5 shadow-card border-white/[0.08]"
            style={{ backgroundColor: "var(--surface)" }}
          >
            {/* Departure */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "#FF6B6B20",
                  border: "1px solid #FF6B6B40",
                }}
              >
                <Plane className="w-6 h-6" style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                  Departure
                </p>
                <p className="text-2xl font-bold text-white mb-3">{departure.code}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                    style={{ backgroundColor: "var(--surface-alt)" }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {departure.date}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                    style={{ backgroundColor: "var(--surface-alt)" }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {departure.time}
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 mb-6" />

            {/* Arrival */}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "#4ECDC420",
                  border: "1px solid #4ECDC440",
                }}
              >
                <Plane className="w-6 h-6 rotate-90" style={{ color: "#4ECDC4" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                  Arrival
                </p>
                <p className="text-2xl font-bold text-white mb-3">{arrival.code}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                    style={{ backgroundColor: "var(--surface-alt)" }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {arrival.date}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                    style={{ backgroundColor: "var(--surface-alt)" }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {arrival.time}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detail Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card
            className="rounded-2xl p-5 shadow-card space-y-4 border-white/[0.08]"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <FieldRow label="Reservation Code" value="AB1234" />
            <div className="h-px bg-white/10" />
            <FieldRow label="Seat" value="12A" />
            <div className="h-px bg-white/10" />
            <FieldRow label="Seat Class" value="Economy" />
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <ActionButton icon={DollarSign} label="Total Cost" iconColor="#FFD93D" />
          <ActionButton icon={FileText} label="Write a note" iconColor="#95E1D3" />
        </motion.div>
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-white text-base group-hover:text-opacity-80 transition-colors">{value}</span>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  iconColor,
  onClick,
}: {
  icon: any
  label: string
  iconColor: string
  onClick?: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4 shadow-card transition-all"
      style={{ backgroundColor: "var(--surface)" }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: `${iconColor}20`,
          border: `1px solid ${iconColor}40`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <span className="text-white text-base">{label}</span>
    </motion.button>
  )
}
