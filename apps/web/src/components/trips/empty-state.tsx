"use client"

import { motion } from "framer-motion"
import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface EmptyStateProps {
  onCreateTrip: () => void
}

export default function EmptyState({ onCreateTrip }: EmptyStateProps) {
  const { t } = useTranslation()
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(255, 107, 107, 0.1)" }}
      >
        <MapPin className="w-10 h-10" style={{ color: "#ff6b6b" }} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('trips.no_trips')}</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {t('trips.no_trips_description')}
      </p>
      <Button
        onClick={onCreateTrip}
        className="rounded-xl font-semibold shadow-lg"
        style={{ background: "#ff6b6b" }}
      >
        <Plus className="w-5 h-5 mr-2" />
        {t('trips.create_first_trip')}
      </Button>
    </motion.div>
  )
}
