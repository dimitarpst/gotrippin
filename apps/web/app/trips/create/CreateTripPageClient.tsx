"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import PageLoader from "@/components/ui/page-loader"
import CreateTrip from "@/components/trips/create-trip"
import { toast } from "sonner"
import { useState, useSyncExternalStore } from "react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { getRandomRouteColor } from "@/lib/route-colors"

export default function CreateTripPageClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [step, setStep] = useState<1 | 2>(1)
  const [pendingData, setPendingData] = useState<{
    title: string
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput
    color?: string
    dateRange?: DateRange
  } | null>(null)

  const handleDetailsNext = async (data: {
    title: string
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput
    color?: string
    dateRange?: DateRange
  }) => {
    setPendingData(data)
    setStep(2)
  }

  const handleOpenRouteEditor = () => {
    if (!pendingData) return
    const tripData: Record<string, unknown> = {
      title: pendingData.title,
    }
    if (pendingData.coverPhoto) tripData.cover_photo = pendingData.coverPhoto
    tripData.color = pendingData.color ?? getRandomRouteColor()
    if (pendingData.dateRange?.from) tripData.start_date = pendingData.dateRange.from.toISOString()
    if (pendingData.dateRange?.to) tripData.end_date = pendingData.dateRange.to.toISOString()
    try {
      sessionStorage.setItem("createTripDraft", JSON.stringify(tripData))
    } catch {
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }))
      return
    }
    router.push("/trips/create/route")
  }

  const handleBack = () => {
    router.push("/")
  }

  if (!mounted) {
    return <PageLoader message={t("trips.loading")} />
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="flex-1 relative z-10">
        {step === 1 ? (
          <CreateTrip onBack={handleBack} onSave={handleDetailsNext} />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-md space-y-4">
              <h1 className="text-2xl font-semibold">
                {t("trips.route_step_ready_title", { defaultValue: "Ready to plan your route?" })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("trips.route_step_ready_body", {
                  defaultValue:
                    "Next we’ll open the map-based route editor so you can sketch your trip from A to B. When you’re done there, your trip will be saved.",
                })}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm text-[var(--color-foreground)] bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t("common.back", { defaultValue: "Back" })}
                </button>
                <button
                  type="button"
                  onClick={handleOpenRouteEditor}
                  className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  {t("trips.route_step_ready_cta", { defaultValue: "Open route editor" })}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
