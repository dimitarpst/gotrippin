"use client"

import { useEffect } from "react"
import PageError from "@/components/ui/page-error"
import { useTranslation } from "react-i18next"

/**
 * Global/Root Error Boundary for the app.
 * Next.js automatically calls this when a client-side error occurs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Uncaught application error:", error)
  }, [error])

  return (
    <PageError
      title={t("common.page_error_title", { defaultValue: "Something went wrong!" })}
      message={error.message || t("common.page_error_description", { defaultValue: "We encountered an unexpected error." })}
      onRetry={() => reset()}
    />
  )
}
