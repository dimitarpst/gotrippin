"use client"

import { CloudOff, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Same outer shell as `WeatherWidget` inline variant (icon-only). */
const INLINE_WEATHER_SHELL =
  "inline-flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-card-foreground shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"

type WeatherUnavailableIndicatorProps = {
  /** `inline` = pill like live weather widget; `bare` = icon only (parent already has the shell). */
  variant?: "inline" | "bare"
  className?: string
  iconClassName?: string
  /** Extra context for screen readers only (e.g. API message). */
  detailsSrOnly?: string | null
}

/** Cloud-off when weather failed / missing; matches real weather chips/cards visually. */
export function WeatherUnavailableIndicator({
  variant = "inline",
  className,
  iconClassName,
  detailsSrOnly,
}: WeatherUnavailableIndicatorProps) {
  const { t } = useTranslation()
  const label = t("weather.unavailable", { defaultValue: "Weather unavailable" })

  const icon = (
    <CloudOff
      className={cn("size-4 shrink-0 text-foreground dark:text-white", iconClassName)}
      aria-hidden
    />
  )

  const a11y = (
    <>
      <span className="sr-only">{label}</span>
      {detailsSrOnly ? <span className="sr-only">{detailsSrOnly}</span> : null}
    </>
  )

  if (variant === "bare") {
    return (
      <span className={cn("inline-flex items-center justify-center", className)} title={label}>
        {icon}
        {a11y}
      </span>
    )
  }

  return (
    <span className={cn(INLINE_WEATHER_SHELL, className)} title={label}>
      {icon}
      {a11y}
    </span>
  )
}

type WeatherUnavailableSummaryCardProps = {
  color: string
  locationLabel: string
  errorMessage?: string | null
  onRetry?: () => void
}

/** Trip overview: same gradient card + layout rhythm as full `WeatherWidget`, icon-only on the right. */
export function WeatherUnavailableSummaryCard({
  color,
  locationLabel,
  errorMessage,
  onRetry,
}: WeatherUnavailableSummaryCardProps) {
  const { t } = useTranslation()
  const label = t("weather.unavailable", { defaultValue: "Weather unavailable" })

  return (
    <Card
      className="relative overflow-hidden border-0 rounded-3xl shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="relative p-5 sm:p-6 flex flex-row items-start justify-between z-10 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>
          <span className="sr-only">{label}</span>
          {errorMessage ? <span className="sr-only">{errorMessage}</span> : null}
        </div>

        <div className="flex flex-col items-end gap-4 shrink-0 pt-2">
          <CloudOff
            className="w-16 h-16 sm:w-24 sm:h-24 text-white/90 drop-shadow-lg"
            aria-hidden
          />
          {onRetry ? (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold text-white"
              onClick={(e) => {
                e.stopPropagation()
                onRetry()
              }}
            >
              {t("weather.retry", { defaultValue: "Retry" })}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
