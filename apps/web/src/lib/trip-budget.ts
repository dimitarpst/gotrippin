import type { TripExpense } from "@gotrippin/core";

/** Currencies we treat as 2-decimal minor units (cents). */
const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

export function minorUnitDivisor(currencyCode: string): number {
  return ZERO_DECIMAL.has(currencyCode.toUpperCase()) ? 1 : 100;
}

export function formatMoneyMinor(
  amountMinor: number,
  currencyCode: string,
  locale?: string
): string {
  const code = currencyCode.toUpperCase();
  const divisor = minorUnitDivisor(code);
  const major = amountMinor / divisor;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: divisor === 1 ? 0 : 2,
    }).format(major);
  } catch {
    return `${(major).toFixed(divisor === 1 ? 0 : 2)} ${code}`;
  }
}

/** Parse user input like "12.50" or "12,50" into minor units for 2-decimal currencies. */
export function parseMajorToMinor(
  raw: string,
  currencyCode: string
): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  const code = currencyCode.toUpperCase();
  const divisor = minorUnitDivisor(code);
  if (divisor === 1) {
    return Math.round(n);
  }
  return Math.round(n * 100);
}

export function sumExpensesInCurrency(
  expenses: TripExpense[],
  currencyCode: string
): number {
  const c = currencyCode.toUpperCase();
  return expenses
    .filter((e) => e.currency_code === c)
    .reduce((acc, e) => acc + e.amount_minor, 0);
}

export function expensesByCurrency(
  expenses: TripExpense[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of expenses) {
    const c = e.currency_code;
    m.set(c, (m.get(c) ?? 0) + e.amount_minor);
  }
  return m;
}
