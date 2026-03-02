"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plane, Hotel, MapPin, Car, Utensils, Palette, Music, 
  ShoppingBag, Calendar as CalendarIcon, Clock, LinkIcon, 
  FileText, AlignLeft, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  TimePicker,
  TimePickerInputGroup,
  TimePickerInput,
  TimePickerSeparator,
  TimePickerTrigger,
  TimePickerContent,
  TimePickerHour,
  TimePickerMinute,
  TimePickerPeriod,
} from "@/components/ui/time-picker"
import { useTripLocations } from "@/hooks/useTripLocations"
import { createActivity, updateActivity, deleteActivity } from "@/lib/api/activities"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { ActivityType, Activity } from "@gotrippin/core"

interface ActivityFormProps {
  tripId: string
  activity?: Activity
  initialType?: ActivityType
  onBack: () => void
  onSave?: () => void
}

const TYPE_ICONS: Record<string, any> = {
  flight: Plane,
  accommodation: Hotel,
  restaurant: Utensils,
  attraction: Palette,
  transport: Car,
  car_rental: Car,
  train: MapPin, // or Train
  bus: MapPin,
  ferry: MapPin,
  museum: Palette,
  concert: Music,
  shopping: ShoppingBag,
  custom: MapPin,
  beach: MapPin,
  hiking: MapPin,
  other: MapPin,
}

const TYPE_COLORS: Record<string, string> = {
  flight: "#4ECDC4",
  accommodation: "#4ECDC4",
  restaurant: "#FFD93D",
  attraction: "#FF6B6B",
  transport: "#FFA07A",
  car_rental: "#FFA07A",
  museum: "#FF6B6B",
  concert: "#FF6B6B",
  shopping: "#A8E6CF",
  custom: "#95E1D3",
}

export default function ActivityForm({ tripId, activity, initialType = "custom", onBack, onSave }: ActivityFormProps) {
  const { locations, loading: locationsLoading, error: locationsError, refetch } = useTripLocations(tripId)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(activity?.location_id || null)
  
  const [saving, setSaving] = useState(false)
  const { accessToken } = useAuth()
  const [deleting, setDeleting] = useState(false)
  
  // Parse metadata from notes if valid JSON
  let parsedMeta: any = { notes: "" }
  if (activity?.notes) {
    try {
      if (activity.notes.trim().startsWith("{")) {
        parsedMeta = JSON.parse(activity.notes)
      } else {
        parsedMeta.notes = activity.notes
      }
    } catch {
      parsedMeta.notes = activity.notes
    }
  }

  const [formData, setFormData] = useState({
    title: activity?.title || "",
    type: activity?.type || initialType,
    date: activity?.start_time ? new Date(activity.start_time).toISOString().split('T')[0] : "",
    time: activity?.start_time ? new Date(activity.start_time).toTimeString().substring(0,5) : "",
    address: parsedMeta.address || "",
    phone: parsedMeta.phone || "",
    website: parsedMeta.website || "",
    reservation: parsedMeta.reservation || "",
    notes: parsedMeta.notes || "",
    
    // Type-specific fields
    flightNumber: parsedMeta.flightNumber || "",
    airline: parsedMeta.airline || "",
    departureAirport: parsedMeta.departureAirport || "",
    arrivalAirport: parsedMeta.arrivalAirport || "",
    seat: parsedMeta.seat || "",
    
    checkInDate: parsedMeta.checkInDate || "",
    checkOutDate: parsedMeta.checkOutDate || "",
    roomType: parsedMeta.roomType || "",
    
    cuisine: parsedMeta.cuisine || "",
    partySize: parsedMeta.partySize || "",
  })

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0 && !activity) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId, activity])

  const handleSave = async () => {
    if (!selectedLocationId && locations.length > 0) {
      toast.error("Please select a route stop")
      return
    }
    if (!formData.title) {
      toast.error("Title is required")
      return
    }
    if (!accessToken) {
      toast.error("Authentication required")
      return
    }

    try {
      setSaving(true)

      // Build start_time if date/time provided
      let start_time = null
      if (formData.date) {
        start_time = new Date(`${formData.date}T${formData.time || "00:00"}:00`).toISOString()
      }

      // Serialize metadata
      const meta = {
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        reservation: formData.reservation,
        notes: formData.notes,
        
        ...(formData.type === 'flight' && {
          flightNumber: formData.flightNumber,
          airline: formData.airline,
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport,
          seat: formData.seat,
        }),
        ...(formData.type === 'accommodation' && {
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          roomType: formData.roomType,
        }),
        ...(formData.type === 'restaurant' && {
          cuisine: formData.cuisine,
          partySize: formData.partySize,
        }),
      }
      
      // Clean empty fields from meta to keep it small
      const cleanMeta = Object.fromEntries(Object.entries(meta).filter(([_, v]) => v !== ""))
      const notesString = Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : null

      const payload = {
        title: formData.title,
        type: formData.type as ActivityType,
        location_id: selectedLocationId,
        notes: notesString,
        start_time,
        end_time: start_time, // For now keeping them same or null
        all_day: !formData.time,
        icon: null,
        color: TYPE_COLORS[formData.type] || TYPE_COLORS.custom,
      }

      if (activity) {
        await updateActivity(activity.id, payload, accessToken)
        toast.success("Activity updated")
      } else {
        await createActivity(tripId, payload, accessToken)
        toast.success("Activity created")
      }

      if (onSave) onSave()
      else onBack()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save activity")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activity || !accessToken) return
    if (!confirm("Are you sure you want to delete this activity?")) return

    try {
      setDeleting(true)
      await deleteActivity(tripId, activity.id, accessToken)
      toast.success("Activity deleted")
      if (onSave) onSave()
      else onBack()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete activity")
    } finally {
      setDeleting(false)
    }
  }

  const noRoute = !locationsLoading && locations.length === 0
  const IconComponent = TYPE_ICONS[formData.type] || TYPE_ICONS.custom
  const themeColor = TYPE_COLORS[formData.type] || TYPE_COLORS.custom

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <motion.div
        className="sticky top-0 z-20 border-b border-white/[0.08] px-6 py-4 backdrop-blur-xl bg-[var(--surface)]/80"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-sm font-medium transition-colors hover:text-white" style={{ color: "var(--accent)" }}>
            Cancel
          </button>
          <h1 className="text-lg font-semibold text-white capitalize">{formData.type.replace('_', ' ')}</h1>
          <button
            className="text-sm font-medium px-4 py-2 rounded-full disabled:opacity-60 transition-transform active:scale-95"
            style={{ backgroundColor: themeColor, color: "#000" }}
            onClick={handleSave}
            disabled={saving || locationsLoading || !tripId || noRoute}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>

      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        {noRoute ? (
          <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-white/5 backdrop-blur-md">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white/50" />
              </div>
              <p className="text-base font-semibold text-white">No Route Yet</p>
              <p className="text-sm text-white/60">Add at least one destination to your trip before adding activities.</p>
              <Button onClick={onBack} variant="outline" className="mt-2 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full px-6">
                Go to Route
              </Button>
            </div>
          </Card>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="space-y-6"
          >
            {/* Main Info */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="rounded-3xl overflow-hidden shadow-xl border-white/[0.08] bg-[var(--surface)]">
                <div className="p-6 flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: `${themeColor}20`, border: `1px solid ${themeColor}40` }}
                  >
                    <IconComponent className="w-7 h-7" style={{ color: themeColor }} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Title</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full text-xl font-bold text-white bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-white/40 h-auto py-1"
                        placeholder="e.g. Grand Hotel"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Timing & Location */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)] space-y-5">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Stop / Destination
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${
                          selectedLocationId === loc.id 
                            ? "bg-white text-black border-transparent shadow-md" 
                            : "border-white/10 text-white/70 hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        {loc.location_name || "Stop"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                      <CalendarIcon className="w-3 h-3" /> Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-white",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(parseISO(formData.date), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-white/10" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date ? parseISO(formData.date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({ ...formData, date: format(date, "yyyy-MM-dd") })
                            } else {
                              setFormData({ ...formData, date: "" })
                            }
                          }}
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Time
                    </label>
                    <TimePicker 
                      value={formData.time} 
                      onValueChange={(val) => setFormData({ ...formData, time: val })}
                      className="w-full"
                    >
                      <TimePickerInputGroup className="bg-white/5 border-white/10 text-white rounded-xl h-10 w-full hover:bg-white/10 transition-colors cursor-pointer">
                        <TimePickerInput segment="hour" className="text-sm font-normal tabular-nums" />
                        <TimePickerSeparator className="text-white/50" />
                        <TimePickerInput segment="minute" className="text-sm font-normal tabular-nums" />
                        <TimePickerInput segment="period" className="text-sm font-normal ml-1 tabular-nums" />
                        <TimePickerTrigger className="text-white/50 hover:text-white ml-auto" />
                      </TimePickerInputGroup>
                      <TimePickerContent className="flex bg-[var(--surface)] border-white/10 rounded-xl shadow-2xl z-50 p-0">
                        <TimePickerHour />
                        <TimePickerMinute />
                        <TimePickerPeriod />
                      </TimePickerContent>
                    </TimePicker>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Type-Specific Sections */}
            {formData.type === 'flight' && (
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)] space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
                    <Plane className="w-3 h-3" /> Flight Details
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Departure</label>
                      <Input
                        value={formData.departureAirport}
                        onChange={(e) => setFormData({ ...formData, departureAirport: e.target.value })}
                        placeholder="JFK"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Arrival</label>
                      <Input
                        value={formData.arrivalAirport}
                        onChange={(e) => setFormData({ ...formData, arrivalAirport: e.target.value })}
                        placeholder="LHR"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Airline</label>
                      <Input
                        value={formData.airline}
                        onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                        placeholder="e.g. Delta"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Flight Number</label>
                      <Input
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                        placeholder="DL 123"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {formData.type === 'accommodation' && (
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)] space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
                    <Hotel className="w-3 h-3" /> Lodging Details
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Check In</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-white mt-1 h-10",
                              !formData.checkInDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.checkInDate ? format(parseISO(formData.checkInDate), "PPP") : <span>Select</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-white/10" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.checkInDate ? parseISO(formData.checkInDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setFormData({ ...formData, checkInDate: format(date, "yyyy-MM-dd") })
                              } else {
                                setFormData({ ...formData, checkInDate: "" })
                              }
                            }}
                            initialFocus
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Check Out</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-white mt-1 h-10",
                              !formData.checkOutDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.checkOutDate ? format(parseISO(formData.checkOutDate), "PPP") : <span>Select</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[var(--surface)] border-white/10" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.checkOutDate ? parseISO(formData.checkOutDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setFormData({ ...formData, checkOutDate: format(date, "yyyy-MM-dd") })
                              } else {
                                setFormData({ ...formData, checkOutDate: "" })
                              }
                            }}
                            initialFocus
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase text-white/40 ml-1">Room Type</label>
                      <Input
                        value={formData.roomType}
                        onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                        placeholder="e.g. King Suite with Ocean View"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {formData.type === 'restaurant' && (
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)] space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
                    <Utensils className="w-3 h-3" /> Dining Details
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Cuisine / Vibe</label>
                      <Input
                        value={formData.cuisine}
                        onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                        placeholder="e.g. Italian, Casual"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-white/40 ml-1">Party Size</label>
                      <Input
                        type="number"
                        value={formData.partySize}
                        onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                        placeholder="2"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-white/30"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Details */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)] space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Details
                </label>
                
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Address"
                      className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-white/30"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        value={formData.reservation}
                        onChange={(e) => setFormData({ ...formData, reservation: e.target.value })}
                        placeholder="Reservation / PNR"
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-white/30 text-sm"
                      />
                    </div>
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="Website URL"
                        className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-white/30 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Card className="rounded-3xl p-6 shadow-xl border-white/[0.08] bg-[var(--surface)]">
                <label className="text-[10px] uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                  <AlignLeft className="w-3 h-3" /> Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any extra notes, things to pack, or reminders..."
                  className="min-h-[120px] bg-white/5 border-white/10 text-white rounded-xl resize-none focus:border-white/30"
                />
              </Card>
            </motion.div>

            {/* Delete button (only if editing) */}
            {activity && (
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="outline"
                  className="w-full mt-4 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl"
                >
                  {deleting ? "Deleting..." : "Delete Activity"}
                </Button>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  )
}
