"use client";

import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";
import type { AiBudgetSummary } from "@/lib/api/ai";

interface AiBudgetCardProps {
  budget: AiBudgetSummary;
}

export default function AiBudgetCard({ budget }: AiBudgetCardProps) {
  const { t, i18n } = useTranslation();
  const amount = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 0,
  }).format(budget.per_person_estimate);

  return (
    <div className="rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{t("ai.budget_title")}</p>
          <p className="text-lg font-semibold text-white">
            {t("ai.budget_per_person", {
              amount,
              currency: budget.currency,
            })}
          </p>
          {budget.assumptions && budget.assumptions.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-white/50">{t("ai.budget_assumptions")}</p>
              <ul className="list-disc space-y-0.5 pl-4 text-sm text-white/75">
                {budget.assumptions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
