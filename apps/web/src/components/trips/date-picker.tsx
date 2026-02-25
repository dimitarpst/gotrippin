"use client"

import { useState, useEffect } from "react"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <Button variant="ghost">{t('date_picker.cancel')}</Button>
            </DrawerClose>
            <DrawerTitle className="mb-0">{t('date_picker.title')}</DrawerTitle>
            <Button
              variant="ghost"
              onClick={handleDone}
              disabled={!canSubmit}
            >
              {t('date_picker.done')}
            </Button>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
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
          {(tripWindowText || (modifiers as any)?.busy) && (
            <div className="mt-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
              {tripWindowText && (
                <div>
                  <span>Trip window:</span>{" "}
                  <span className="font-medium text-foreground">{tripWindowText}</span>
                </div>
              )}
              {(modifiers as any)?.busy && (
                <div>
                  <span>Tip:</span>{" "}
                  <span className="text-foreground">
                    Dates used by other stops are shaded.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

