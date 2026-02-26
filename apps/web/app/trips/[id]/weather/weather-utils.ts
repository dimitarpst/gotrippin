import { Sun, Cloud, CloudRain, CloudSnow, type LucideIcon } from "lucide-react"

export function getWeatherIcon(code?: number | null): LucideIcon {
  if (code === 1000 || code === 1100) return Sun
  if (code === 1101 || code === 1102) return Cloud
  if (code === 1001) return Cloud
  if (typeof code === "number" && code >= 4000 && code <= 4201) return CloudRain
  if (typeof code === "number" && code >= 5000 && code <= 5101) return CloudSnow
  return Cloud
}

export function formatTemp(temp?: number | null): string {
  if (typeof temp !== "number" || !Number.isFinite(temp)) return "—"
  return `${Math.round(temp)}°`
}

export function formatDayLabel(dateIso: string, index: number): string {
  if (index === 0) return "Today"
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { weekday: "short" })
}

export function formatStopDateRange(arrival?: string | null, departure?: string | null): string | null {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
  const a = arrival ? new Date(arrival) : null
  const d = departure ? new Date(departure) : null
  const aOk = a && !Number.isNaN(a.getTime()) ? formatter.format(a) : null
  const dOk = d && !Number.isNaN(d.getTime()) ? formatter.format(d) : null
  if (aOk && dOk) return `${aOk} → ${dOk}`
  return aOk || dOk || null
}

export function getUpdatedLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  updatedAt?: number | null
): string | null {
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null
  const diffMs = Date.now() - updatedAt
  if (!Number.isFinite(diffMs) || diffMs < 0) return null
  const minutes = Math.floor(diffMs / 60000)
  if (minutes <= 0) return t("weather.updated_just_now", { defaultValue: "Updated just now" })
  return t("weather.updated", { defaultValue: "Updated {{minutes}}m ago", minutes })
}
