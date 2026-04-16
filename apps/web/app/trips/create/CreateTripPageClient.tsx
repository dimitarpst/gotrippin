"use client"

import { useRouter } from "next/navigation"
import AuroraBackground from "@/components/effects/aurora-background"
import PageLoader from "@/components/ui/page-loader"
import CreateTrip from "@/components/trips/create-trip"
import { toast } from "sonner"
import { useState, useSyncExternalStore } from "react"
import { createAiSession } from "@/lib/api/ai"
import { AI_PLAN_CONTEXT_STORAGE_KEY } from "@/lib/ai/aiPlanContextStorage"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import { getRandomRouteColor } from "@/lib/route-colors"

export default function CreateTripPageClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [step, setStep] = useState<1 | 2>(1)
  const [planWithAiLoading, setPlanWithAiLoading] = useState(false)
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

  async function handlePlanWithAi() {
    if (planWithAiLoading) return
    setPlanWithAiLoading(true)
    try {
      if (pendingData) {
        const payload = {
          v: 1 as const,
          title: pendingData.title.trim(),
          start_date: pendingData.dateRange?.from?.toISOString() ?? null,
          end_date: pendingData.dateRange?.to?.toISOString() ?? null,
        }
        try {
          sessionStorage.setItem(AI_PLAN_CONTEXT_STORAGE_KEY, JSON.stringify(payload))
        } catch (e) {
          console.error("[CreateTripPageClient] sessionStorage ai plan context failed", e)
        }
      }
      const res = await createAiSession({ scope: "global" })
      router.push(`/ai/${res.session_id}`)
    } catch (err) {
      console.error(err)
      toast.error(t("common.error_occurred", { defaultValue: "An error occurred" }))
    } finally {
      setPlanWithAiLoading(false)
    }
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <AuroraBackground />

      <div className="relative z-10 flex-1">
        {step === 1 ? (
          <CreateTrip onBack={handleBack} onSave={handleDetailsNext} />
        ) : (
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            {/* Same top bar as step 1: Back | step dots | CTA */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-12">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-border bg-background/70 px-4 py-2 text-lg font-medium text-primary backdrop-blur-md transition-colors hover:bg-muted/90 dark:border-white/20 dark:bg-background/40 dark:hover:bg-white/10"
              >
                {t("common.back", { defaultValue: "Back" })}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/90 px-2.5 py-1 text-xs font-medium text-foreground dark:bg-white/10 dark:text-white/90">
                <span className="text-muted-foreground dark:text-white/50">1</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground dark:text-white">2</span>
              </span>
              <div className="flex max-w-[min(100%,24rem)] flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handlePlanWithAi()}
                  disabled={planWithAiLoading}
                  className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-muted/90 disabled:opacity-50 dark:border-white/20 dark:bg-background/40"
                >
                  {t("trips.plan_with_ai", { defaultValue: "Plan with AI" })}
                </button>
                <button
                  type="button"
                  onClick={handleOpenRouteEditor}
                  className="rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:brightness-[0.96] active:brightness-[0.92]"
                >
                  {t("trips.route_step_ready_cta", { defaultValue: "Open route editor" })}
                </button>
              </div>
            </div>
            {/* Centered content: trip name + short line, same feel as step 1 */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-32">
              <p className="mb-2 text-lg text-muted-foreground">
                {t("trips.route_step_label", { defaultValue: "Step 2 of 2" })}
              </p>
              <h1 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl">
                {pendingData?.title || t("trips.untitled_trip")}
              </h1>
              <p className="max-w-sm text-center text-lg text-muted-foreground">
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
