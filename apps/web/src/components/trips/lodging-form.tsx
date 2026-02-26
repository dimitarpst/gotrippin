"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Hotel, Calendar, Clock, DollarSign, FileText, LinkIcon, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, Camera } from "lucide-react"
import { useTripLocations } from "@/hooks/useTripLocations"
import { createActivity } from "@/lib/api/activities"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface LodgingFormProps {
  tripId: string
  onBack: () => void
}

export default function LodgingForm({ tripId, onBack }: LodgingFormProps) {
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const { locations, loading: locationsLoading, error: locationsError, refetch } = useTripLocations(tripId)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { accessToken } = useAuth()
  
  // Hardcoded data for visual tweaking
  const [formData, setFormData] = useState({
    name: "Grand Hotel",
    address: "123 Main Street, City",
    checkInDate: "26 Oct",
    checkInTime: "3:00 PM",
    phone: "(555) 123-4567",
    website: "https://tripsy.app",
    reservationCode: "ABC123",
    roomType: "Suite",
    roomNumber: "104",
  })

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  const handleSave = async () => {
    setStatusMessage(null)
    setErrorMessage(null)

    if (!selectedLocationId) {
      setErrorMessage("Select a route stop before saving.")
      return
    }
    if (!accessToken) {
      setErrorMessage("Authentication required. Please refresh or sign in again.")
      return
    }

    try {
      setSaving(true)
      await createActivity(tripId, {
        title: formData.name || "Lodging",
        type: "accommodation",
        location_id: selectedLocationId,
        notes: formData.reservationCode ? `Reservation: ${formData.reservationCode}` : undefined,
        start_time: null,
        end_time: null,
        all_day: true,
      }, accessToken)
      setStatusMessage("Saved to timeline for this stop.")
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save activity")
    } finally {
      setSaving(false)
    }
  }

  const noRoute = !locationsLoading && locations.length === 0

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
          <h1 className="text-lg font-semibold text-white">Lodging</h1>
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
            onClick={handleSave}
            disabled={saving || locationsLoading || !tripId || noRoute}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {!tripId && (
          <p className="mt-2 text-xs text-yellow-200/80">Waiting for trip to load…</p>
        )}
        {locationsError && (
          <div className="mt-2 text-xs text-red-300 flex items-center gap-2">
            <span>Failed to load stops: {locationsError}</span>
            <button
              onClick={() => refetch().catch((e: unknown) => toast.error("Retry failed", { description: e instanceof Error ? e.message : String(e) }))}
              className="underline decoration-dotted text-white/80"
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}
        {statusMessage && <p className="mt-2 text-xs text-emerald-300">{statusMessage}</p>}
      </motion.div>

      <div className="px-6 py-6 space-y-4">
        {noRoute && (
          <Card
            className="rounded-2xl p-5 shadow-card border-white/[0.08] space-y-3"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <p className="text-sm font-semibold text-white">No route yet</p>
            <p className="text-sm text-white/70">
              Add at least one stop to your trip before creating lodging entries.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-white/20 text-white hover:border-white/40 transition"
              >
                Go to route
              </button>
              <button
                onClick={() => refetch().catch((e: unknown) => toast.error("Retry failed", { description: e instanceof Error ? e.message : String(e) }))}
                className="text-sm font-medium px-4 py-2 rounded-lg text-white/80 underline decoration-dotted"
              >
                Retry
              </button>
            </div>
          </Card>
        )}
        {!noRoute && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {/* Stop selector */}
          <Card
            className="rounded-2xl p-5 shadow-card border-white/[0.08] space-y-3"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Attach to stop</p>
              {locationsLoading && (
                <span className="text-xs text-white/60">Loading stops...</span>
              )}
            </div>
            {locations.length === 0 && !locationsLoading && (
              <div className="text-sm text-white/70">
                Add a route first to place this activity. Go back and add stops.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${selectedLocationId === loc.id ? "border-[#ff6b6b] bg-[#ff6b6b]/15 text-white" : "border-white/10 text-white/80 hover:border-white/30"}`}
                >
                  {loc.location_name || "Stop"}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Name Field */}
          <Card
            className="rounded-2xl p-5 shadow-card border-white/[0.08] space-y-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div>
              <label className="text-xs mb-2 block" style={{ color: "var(--muted)" }}>
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-white bg-transparent border-white/[0.08]"
                placeholder="Hotel name"
              />
            </div>
            <div>
              <label className="text-xs mb-2 block" style={{ color: "var(--muted)" }}>
                Address
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-white bg-transparent border-white/[0.08]"
                placeholder="Address"
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Check-in */}
          <Card
            className="rounded-2xl p-5 shadow-card border-white/[0.08]"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="text-sm font-medium text-white">Check-in</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                style={{ backgroundColor: "var(--surface-alt)" }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {formData.checkInDate}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:bg-opacity-80 transition-all bg-transparent border-white/[0.08]"
                style={{ backgroundColor: "var(--surface-alt)" }}
              >
                <Clock className="w-4 h-4 mr-2" />
                {formData.checkInTime}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Contact & Booking Info */}
          <Card
            className="rounded-2xl p-5 shadow-card space-y-4 border-white/[0.08]"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <FieldRow label="Phone" value={formData.phone} />
            <div className="h-px bg-white/10" />
            <FieldRow label="Website" value={formData.website} />
            <div className="h-px bg-white/10" />
            <FieldRow label="Reservation Code" value={formData.reservationCode} />
            <div className="h-px bg-white/10" />
            <FieldRow label="Room Type" value={formData.roomType} />
            <div className="h-px bg-white/10" />
            <FieldRow label="Room Number" value={formData.roomNumber} />
          </Card>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {/* Action Buttons */}
          <ActionButton icon={DollarSign} label="Total Cost" iconColor="#FFD93D" />
          <ActionButton icon={FileText} label="Write a note" iconColor="#95E1D3" />
          <ActionButton
            icon={LinkIcon}
            label="Add File, Photo or Link"
            iconColor="#FFA07A"
            onClick={() => setShowDocumentModal(true)}
          />
        </motion.div>
        </>
        )}
      </div>

      {/* Add Document Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent
          className="rounded-3xl p-0 overflow-hidden max-w-sm backdrop-blur-xl border-white/[0.08]"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-white text-center">Add Document</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-6 space-y-2">
              <ModalOption icon={FileText} label="Import Document" />
              <ModalOption icon={LinkIcon} label="Save Link" />
              <ModalOption icon={ImageIcon} label="Choose Photo from Library" />
              <ModalOption icon={Camera} label="Take a Photo" />
              <ModalOption icon={StickyNote} label="New Note" />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
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

function ModalOption({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.button
      className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors"
      style={{ backgroundColor: "var(--surface-alt)" }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
      <span className="text-white text-sm">{label}</span>
    </motion.button>
  )
}

