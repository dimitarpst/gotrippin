"use client"

import { useState } from "react"
import { LocationCard } from "./location-card"
import { Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DateRange } from "react-day-picker"
import { v4 as uuidv4 } from "uuid"
import * as Sortable from "@/components/ui/sortable"

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
    onChange(locations.filter(loc => loc.id !== id))
  }

  const updateLocation = (id: string, updates: Partial<RouteLocation>) => {
    onChange(locations.map(loc => 
      loc.id === id ? { ...loc, ...updates } : loc
    ))
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Your route</h2>
          <p className="text-sm text-white/60">Add the key stops for this trip</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
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
              <Sortable.Item key={location.id} value={location.id} asChild>
                <LocationCard
                  index={index}
                  name={location.name}
                  arrivalDate={location.arrivalDate}
                  departureDate={location.departureDate}
                  onRemove={() => removeLocation(location.id)}
                  onUpdateName={(name) => updateLocation(location.id, { name })}
                  onUpdateDates={(range: DateRange | undefined) => {
                    updateLocation(location.id, {
                      arrivalDate: range?.from?.toISOString(),
                      departureDate: range?.to?.toISOString(),
                    })
                  }}
                />
              </Sortable.Item>
            ))}
          </AnimatePresence>
        </Sortable.Content>

        <Sortable.Overlay>
          <div className="size-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl" />
        </Sortable.Overlay>
      </Sortable.Root>

      <motion.button
        layout
        onClick={addLocation}
        className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/5 text-white/40 hover:text-[#ff6b6b] transition-all flex items-center justify-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#ff6b6b] flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4 text-current group-hover:text-white" />
        </div>
        <span className="font-medium">Add Destination</span>
      </motion.button>
      
      {locations.length < 2 && (
        <p className="text-center text-xs text-red-400/80 mt-4 bg-red-500/5 py-2 rounded-lg">
          Please add at least 2 stops to create a route
        </p>
      )}
    </div>
  )
}

