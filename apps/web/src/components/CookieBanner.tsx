"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "gotrippin_cookie_notice_dismissed"

/** Public marketing / legal surfaces only — not trips, explore, user settings, AI, etc. */
const COOKIE_NOTICE_ROUTES = new Set(["/home", "/privacy", "/terms"])

export default function CookieBanner() {
  const pathname = usePathname()
  const onMarketingRoute = pathname != null && COOKIE_NOTICE_ROUTES.has(pathname)

  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!onMarketingRoute) {
      setVisible(false)
      return
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false)
        return
      }
    } catch (error) {
      console.warn("CookieBanner: sessionStorage unavailable", error)
    }
    setVisible(true)
  }, [onMarketingRoute])

  if (!onMarketingRoute || !visible) {
    return null
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch (error) {
      console.warn("CookieBanner: could not persist dismiss", error)
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label={t("cookie_notice.region_aria")}
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/85 dark:border-white/10 dark:bg-background/90"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed text-muted-foreground dark:text-white/75">
          {t("cookie_notice.body")}{" "}
          <Link href="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline dark:text-white">
            {t("cookie_notice.privacy_link")}
          </Link>
        </p>
        <Button type="button" size="sm" className="shrink-0 self-end sm:self-auto" onClick={dismiss}>
          {t("cookie_notice.dismiss")}
        </Button>
      </div>
    </div>
  )
}
