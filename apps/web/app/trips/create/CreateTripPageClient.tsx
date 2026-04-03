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
    coverUploadStorageKey?: string
    color?: string
    dateRange?: DateRange
  } | null>(null)

  const handleDetailsNext = async (data: {
    title: string
    coverPhoto?: import("@gotrippin/core").CoverPhotoInput
    coverUploadStorageKey?: string
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
    if (pendingData.coverUploadStorageKey) {
      tripData.cover_upload_storage_key = pendingData.coverUploadStorageKey
    } else if (pendingData.coverPhoto) {
      tripData.cover_photo = pendingData.coverPhoto
    }
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
    router.push("/trips")
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
          <div className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Same top bar as step 1: Back | step dots | CTA */}
            <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-full text-[#ff7670] text-lg font-medium backdrop-blur-md border border-white/20 hover:bg-white/5 transition-colors"
              >
                {t("common.back", { defaultValue: "Back" })}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                <span className="text-white/50">1</span>
                <span className="text-white/40">/</span>
                <span className="text-white">2</span>
              </span>
              <button
                type="button"
                onClick={handleOpenRouteEditor}
                className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
              >
                {t("trips.route_step_ready_cta", { defaultValue: "Open route editor" })}
              </button>
            </div>
            {/* Centered content: trip name + short line, same feel as step 1 */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
              <p className="text-white/60 text-lg mb-2">
                {t("trips.route_step_label", { defaultValue: "Step 2 of 2" })}
              </p>
              <h1 className="text-white text-4xl md:text-5xl font-bold text-center mb-4">
                {pendingData?.title || t("trips.untitled_trip")}
              </h1>
              <p className="text-white/70 text-center text-lg max-w-sm">
                {t("trips.route_step_ready_short", {
                  defaultValue: "Add your first stop on the map — we’ll create your trip when you do.",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
