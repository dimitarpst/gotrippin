"use client"

import { motion, AnimatePresence } from "framer-motion"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (dateRange: DateRange | undefined) => void
  selectedDateRange?: DateRange
}

export function DatePicker({ open, onClose, onSelect, selectedDateRange }: DatePickerProps) {
  const handleDateSelect = (dateRange: DateRange | undefined) => {
    onSelect(dateRange)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1c1c1e] rounded-t-3xl max-h-[90vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <button onClick={onClose} className="text-[#ff6b6b] text-lg font-medium">
                Cancel
              </button>
              <h2 className="text-white text-lg font-semibold">Select Dates</h2>
              <button
                onClick={() => {
                  if (selectedDateRange?.from && selectedDateRange?.to) {
                    onClose()
                  }
                }}
                className="text-[#ff6b6b] text-lg font-medium disabled:opacity-50"
                disabled={!selectedDateRange?.from || !selectedDateRange?.to}
              >
                Done
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Calendar
                mode="range"
                defaultMonth={selectedDateRange?.from || new Date()}
                selected={selectedDateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                className="w-full"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

