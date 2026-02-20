"use client"

import AuroraBackground from "@/components/effects/aurora-background"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface PageErrorProps {
  message?: string
  title?: string
  onRetry?: () => void
  className?: string
  showAurora?: boolean
}

/**
 * PageError - A full-page error state component.
 * Uses shadcn Alert and optional AuroraBackground for consistency.
 */
export default function PageError({
  message,
  title,
  onRetry,
  className,
  showAurora = true,
}: PageErrorProps) {
  const { t } = useTranslation()

  return (
    <main
      className={cn(
        "relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden",
        className
      )}
    >
      {showAurora && <AuroraBackground />}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive" className="bg-destructive/10 backdrop-blur-md border-destructive/20">
            <AlertCircle className="size-4" />
            <AlertTitle>{title || t("common.error_title", { defaultValue: "Something went wrong" })}</AlertTitle>
            <AlertDescription>
              {message || t("common.error_description", { defaultValue: "We couldn't load this page. Please try again." })}
            </AlertDescription>
          </Alert>

          {onRetry && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onRetry}
                className="gap-2 border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="size-4" />
                {t("common.retry", { defaultValue: "Retry" })}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
