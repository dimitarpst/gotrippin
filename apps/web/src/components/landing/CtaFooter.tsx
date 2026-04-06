"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/theme-toggle"

const FooterLanguageMenu = dynamic(
  () =>
    import("./FooterLanguageMenu").then((m) => ({
      default: m.FooterLanguageMenu,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="inline-flex h-9 min-w-[7rem] items-center gap-2 rounded-md px-2"
        aria-hidden
      >
        <span className="h-4 w-4 shrink-0 rounded bg-muted/80 animate-pulse" />
        <span className="h-4 flex-1 max-w-[5rem] rounded bg-muted/80 animate-pulse" />
      </div>
    ),
  },
)

const GITHUB = "https://github.com/dimitarpst/gotrippin"
const GITHUB_ISSUES = "https://github.com/dimitarpst/gotrippin/issues"

export default function CtaFooter() {
  const { t } = useTranslation()

  return (
    <footer className="relative border-t border-border bg-background text-foreground dark:border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/home" className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="gotrippin home">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs dark:text-white/55">{t("landing.footer.tagline")}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground dark:text-white">{t("landing.footer.product")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground dark:text-white/55">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors dark:hover:text-white">
                  {t("landing.footer.features")}
                </Link>
              </li>
              <li>
                <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors dark:hover:text-white">
                  {t("landing.footer.github")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground dark:text-white">{t("landing.footer.legal")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground dark:text-white/55">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors dark:hover:text-white">
                  {t("landing.footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors dark:hover:text-white">
                  {t("landing.footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground dark:text-white">{t("landing.footer.support")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground dark:text-white/55">
              <li>
                <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors dark:hover:text-white">
                  {t("landing.footer.github_issues")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/45">
            <Logo variant="sm" className="h-5 w-auto opacity-80" />
            <span suppressHydrationWarning>© {new Date().getFullYear()} gotrippin</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide mr-2 dark:text-white/40">{t("landing.footer.appearance")}</span>
            <ThemeToggle className="h-9 w-9 shrink-0 border border-border hover:bg-muted/80 dark:border-white/10 dark:hover:bg-white/5" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide ml-3 mr-2 dark:text-white/40">{t("landing.footer.language")}</span>
            <FooterLanguageMenu />
          </div>
        </div>
      </div>
    </footer>
  )
}
