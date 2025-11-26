"use client"

import { useState } from "react"
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { LocationCard } from "./location-card"
import { Plus, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DateRange } from "react-day-picker"
import { v4 as uuidv4 } from 'uuid'

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = locations.findIndex((item) => item.id === active.id)
      const newIndex = locations.findIndex((item) => item.id === over.id)
      onChange(arrayMove(locations, oldIndex, newIndex))
    }
  }

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

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={locations.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {locations.map((location, index) => (
                <LocationCard
                  key={location.id}
                  id={location.id}
                  index={index}
                  name={location.name}
                  arrivalDate={location.arrivalDate}
                  departureDate={location.departureDate}
                  onRemove={() => removeLocation(location.id)}
                  onUpdateName={(name) => updateLocation(location.id, { name })}
                  onUpdateDates={(range: DateRange | undefined) => {
                    updateLocation(location.id, {
                      arrivalDate: range?.from?.toISOString(),
                      departureDate: range?.to?.toISOString()
                    })
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

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

