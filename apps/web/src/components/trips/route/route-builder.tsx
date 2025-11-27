"use client"

import { LocationCard } from "./location-card"
import { Plus, GripVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DateRange } from "react-day-picker"
import { v4 as uuidv4 } from "uuid"
import { Sortable } from "@/components/ui/sortable"

export interface RouteLocation {
  id: string
  name: string
  arrivalDate?: string | null
  departureDate?: string | null
}

interface RouteBuilderProps {
  locations: RouteLocation[]
  onChange: (locations: RouteLocation[]) => void
  className?: string
}

export function RouteBuilder({ locations, onChange, className }: RouteBuilderProps) {
  const addLocation = () => {
    const newLocation: RouteLocation = {
      id: uuidv4(),
      name: "",
    }
    onChange([...locations, newLocation])
  }

  const removeLocation = (id: string) => {
    onChange(locations.filter((loc) => loc.id !== id))
  }

  const updateLocation = (id: string, updates: Partial<RouteLocation>) => {
    onChange(
      locations.map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc,
      ),
    )
  }

  const renderHandle = () => (
    <Sortable.ItemHandle asChild>
      <button
        type="button"
        className="cursor-grab select-none p-2 -ml-2 text-white/30 transition-colors hover:text-white/70 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </Sortable.ItemHandle>
  )

  return (
    <div className={className}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your route</h2>
          <p className="text-sm text-white/60">
            Add the key stops for this trip
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
          {locations.length} stops
        </div>
      </div>

      <Sortable.Root
        value={locations}
        onValueChange={onChange}
        getItemValue={(item) => item.id}
        orientation="vertical"
      >
        <Sortable.Content className="space-y-1">
          <AnimatePresence mode="popLayout">
            {locations.map((location, index) => (
              <Sortable.Item key={location.id} value={location.id} className="w-full">
                <LocationCard
                  index={index}
                  name={location.name}
                  arrivalDate={location.arrivalDate}
                  departureDate={location.departureDate}
                  onRemove={() => removeLocation(location.id)}
                  onUpdateName={(name) =>
                    updateLocation(location.id, { name })
                  }
                  onUpdateDates={(range: DateRange | undefined) => {
                    updateLocation(location.id, {
                      arrivalDate: range?.from?.toISOString(),
                      departureDate: range?.to?.toISOString(),
                    })
                  }}
                  dragHandle={renderHandle()}
                />
              </Sortable.Item>
            ))}
          </AnimatePresence>
        </Sortable.Content>

        <Sortable.Overlay>
          {(activeItem) => {
            const location = activeItem.value as RouteLocation | undefined
            if (!location) return null
            const overlayIndex = locations.findIndex(
              (loc) => loc.id === location.id,
            )

            return (
              <div className="w-[320px]">
                <LocationCard
                  index={overlayIndex === -1 ? 0 : overlayIndex}
                  name={location.name}
                  arrivalDate={location.arrivalDate}
                  departureDate={location.departureDate}
                  dragHandle={
                    <div className="p-2 -ml-2 text-white/30">
                      <GripVertical className="h-5 w-5" />
                    </div>
                  }
                  isOverlay
                />
              </div>
            )
          }}
        </Sortable.Overlay>
      </Sortable.Root>

      <motion.button
        layout
        onClick={addLocation}
        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-4 text-white/40 transition-all hover:border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/5 hover:text-[#ff6b6b]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-[#ff6b6b]">
          <Plus className="h-4 w-4 text-current group-hover:text-white" />
        </div>
        <span className="font-medium">Add Destination</span>
      </motion.button>

      {locations.length < 2 && (
        <p className="mt-4 rounded-lg bg-red-500/5 py-2 text-center text-xs text-red-400/80">
          Please add at least 2 stops to create a route
        </p>
      )}
    </div>
  )
}

