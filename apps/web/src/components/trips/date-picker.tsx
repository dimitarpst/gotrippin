"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import type { Matcher } from "react-day-picker"

interface DatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (dateRange: DateRange | undefined) => void
  selectedDateRange?: DateRange
  minDate?: Date
  maxDate?: Date
  modifiers?: Record<string, Matcher | Matcher[]>
}

export function DatePicker({
  open,
  onClose,
  onSelect,
  selectedDateRange,
  minDate,
  maxDate,
  modifiers,
}: DatePickerProps) {
  const { t } = useTranslation()
  const [localRange, setLocalRange] = useState<DateRange | undefined>(selectedDateRange)

  useEffect(() => {
    if (open) {
      setLocalRange(selectedDateRange)
    }
  }, [open, selectedDateRange])

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setLocalRange(dateRange)
  }

  const handleDone = () => {
    if (localRange?.from && localRange?.to) {
      onSelect(localRange)
    }
    onClose()
  }

  const canSubmit = !!(localRange?.from && localRange?.to)

  const tripWindowText =
    minDate && maxDate
      ? `${format(minDate, "MMM d")} – ${format(maxDate, "MMM d")}`
      : null

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
                {t('date_picker.cancel')}
              </button>
              <h2 className="text-white text-lg font-semibold">{t('date_picker.title')}</h2>
              <button
                onClick={handleDone}
                className="text-[#ff6b6b] text-lg font-medium disabled:opacity-50"
                disabled={!canSubmit}
              >
                {t('date_picker.done')}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Calendar
                mode="range"
                defaultMonth={localRange?.from || selectedDateRange?.from || new Date()}
                selected={localRange}
                onSelect={handleDateSelect}
                fromDate={minDate}
                toDate={maxDate}
                disabled={
                  minDate && maxDate ? [{ before: minDate }, { after: maxDate }] : undefined
                }
                modifiers={modifiers}
                numberOfMonths={2}
                className="w-full"
              />

              {/* Context footer for constrained pickers */}
              {(tripWindowText || (modifiers as any)?.busy) && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 space-y-1">
                  {tripWindowText && (
                    <div>
                      <span className="text-white/50">Trip window:</span>{" "}
                      <span className="text-white/80 font-medium">{tripWindowText}</span>
                    </div>
                  )}
                  {(modifiers as any)?.busy && (
                    <div>
                      <span className="text-white/50">Tip:</span>{" "}
                      <span className="text-white/80">
                        Dates used by other stops are shaded.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

