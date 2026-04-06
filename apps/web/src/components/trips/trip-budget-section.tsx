"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Trash2,
  Pencil,
  Utensils,
  Bus,
  Bed,
  Ticket,
  CircleDot,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Activity, Trip, TripExpense, TripLocation } from "@gotrippin/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTripAction } from "@/actions/trips";
import {
  createTripExpense,
  deleteTripExpense,
  fetchTripExpenses,
  updateTripExpense,
} from "@/lib/api/trip-expenses";
import {
  expensesByCurrency,
  formatMoneyMinor,
  parseMajorToMinor,
  sumExpensesInCurrency,
  minorUnitDivisor,
} from "@/lib/trip-budget";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_CURRENCIES = ["EUR", "USD", "GBP", "BGN", "CHF"] as const;

const BUDGET_CATEGORIES = ["food", "transport", "lodging", "activities", "other"] as const;

const SELECT_CLASS = cn(
  "h-11 w-full rounded-xl border border-border/50 bg-background/60 px-3 text-sm shadow-none outline-none backdrop-blur-sm transition-[color,box-shadow]",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5",
);

const SELECT_COMPACT = cn(
  SELECT_CLASS,
  "h-14 w-[5.25rem] shrink-0 px-2 text-center text-base font-semibold tabular-nums sm:h-16 sm:w-[5.75rem]",
);

const INPUT_GLASS = cn(
  "border-border/50 bg-background/60 shadow-none backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
);

function categoryBarBg(cat: string | null | undefined): string {
  switch (cat?.toLowerCase()) {
    case "food":
      return "bg-amber-500";
    case "transport":
      return "bg-sky-500";
    case "lodging":
      return "bg-violet-500";
    case "activities":
      return "bg-emerald-500";
    default:
      return "bg-primary";
  }
}

export interface TripBudgetEditorProps {
  trip: Trip;
  routeLocations: TripLocation[];
  activitiesByLocation: Record<string, Activity[]>;
  unassignedActivities: Activity[];
  /** Prefill add-expense stop / activity (e.g. from timeline or map deep link). */
  defaultExpenseLocationId?: string;
  defaultExpenseActivityId?: string;
}

/**
 * Trip budget — hero spent total, quick add, list, optional cap (disclosed).
 */
export function TripBudgetEditor({
  trip,
  routeLocations,
  activitiesByLocation,
  unassignedActivities,
  defaultExpenseLocationId = "",
  defaultExpenseActivityId = "",
}: TripBudgetEditorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(
    () => Boolean(defaultExpenseLocationId || defaultExpenseActivityId),
  );
  const [planningOpen, setPlanningOpen] = useState(false);

  const allActivities = useMemo(() => {
    const list: Activity[] = [...unassignedActivities];
    for (const locId of Object.keys(activitiesByLocation)) {
      const chunk = activitiesByLocation[locId];
      if (chunk) list.push(...chunk);
    }
    return list;
  }, [activitiesByLocation, unassignedActivities]);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchTripExpenses(trip.id);
      setExpenses(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadError(msg);
      console.error("[TripBudgetEditor] fetch expenses", e);
    } finally {
      setLoading(false);
    }
  }, [trip.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (defaultExpenseLocationId || defaultExpenseActivityId) {
      setExpenseDetailsOpen(true);
    }
  }, [defaultExpenseLocationId, defaultExpenseActivityId]);

  const onTripBudgetSaved = () => router.refresh();
  const onExpensesChanged = () => void reload();

  const budgetCurrency = trip.budget_currency?.toUpperCase() ?? null;
  const budgetCapMinor = trip.budget_amount_minor ?? null;

  const spentForBudgetCurrency =
    budgetCurrency != null ? sumExpensesInCurrency(expenses, budgetCurrency) : null;

  const byCur = useMemo(() => expensesByCurrency(expenses), [expenses]);

  const primarySpentLabel = useMemo(() => {
    if (budgetCurrency != null && spentForBudgetCurrency != null) {
      return formatMoneyMinor(spentForBudgetCurrency, budgetCurrency);
    }
    if (byCur.size === 0) return null;
    if (byCur.size === 1) {
      const [code, minor] = [...byCur.entries()][0];
      return formatMoneyMinor(minor, code);
    }
    return t("trip_overview.budget_multi_currency", {
      defaultValue: "Multiple currencies",
    });
  }, [budgetCurrency, spentForBudgetCurrency, byCur, t]);

  const progressPct =
    budgetCapMinor != null &&
    budgetCapMinor > 0 &&
    spentForBudgetCurrency != null
      ? Math.min(100, (spentForBudgetCurrency / budgetCapMinor) * 100)
      : null;

  const [budgetMajor, setBudgetMajor] = useState("");
  const [budgetCurrencyInput, setBudgetCurrencyInput] = useState(
    trip.budget_currency?.toUpperCase() ?? "EUR",
  );
  const [savingBudget, setSavingBudget] = useState(false);

  const defaultExpenseCurrency = trip.budget_currency?.toUpperCase() ?? "EUR";

  const [amountMajor, setAmountMajor] = useState("");
  const [expCurrency, setExpCurrency] = useState(defaultExpenseCurrency);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [locationId, setLocationId] = useState<string>(defaultExpenseLocationId);
  const [activityId, setActivityId] = useState<string>(defaultExpenseActivityId);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setExpCurrency(defaultExpenseCurrency);
  }, [defaultExpenseCurrency]);

  useEffect(() => {
    if (defaultExpenseLocationId) {
      setLocationId(defaultExpenseLocationId);
    }
    if (defaultExpenseActivityId) {
      setActivityId(defaultExpenseActivityId);
    }
  }, [defaultExpenseLocationId, defaultExpenseActivityId]);

  useEffect(() => {
    if (!activityId) return;
    const list = locationId
      ? allActivities.filter((a) => a.location_id === locationId)
      : allActivities;
    if (!list.some((a) => a.id === activityId)) {
      setActivityId("");
    }
  }, [activityId, locationId, allActivities]);

  const handleSaveTripBudget = async () => {
    const minor = parseMajorToMinor(budgetMajor.trim(), budgetCurrencyInput);
    if (minor === null || minor < 0) {
      toast.error(
        t("trip_overview.budget_invalid_amount", { defaultValue: "Enter a valid amount" }),
      );
      return;
    }
    const cur = budgetCurrencyInput.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur)) {
      toast.error(
        t("trip_overview.budget_invalid_currency", { defaultValue: "Use a 3-letter currency code" }),
      );
      return;
    }
    setSavingBudget(true);
    try {
      const r = await updateTripAction(trip.id, {
        budget_amount_minor: minor,
        budget_currency: cur,
      });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(t("trip_overview.budget_saved", { defaultValue: "Budget saved" }));
      onTripBudgetSaved();
      setPlanningOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(String(e));
    } finally {
      setSavingBudget(false);
    }
  };

  const handleClearTripBudget = async () => {
    setSavingBudget(true);
    try {
      const r = await updateTripAction(trip.id, {
        budget_amount_minor: null,
        budget_currency: null,
      });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success(t("trip_overview.budget_cleared", { defaultValue: "Budget cap removed" }));
      setBudgetMajor("");
      onTripBudgetSaved();
      setPlanningOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(String(e));
    } finally {
      setSavingBudget(false);
    }
  };

  const handleAddExpense = async () => {
    const minor = parseMajorToMinor(amountMajor.trim(), expCurrency);
    if (minor === null || minor <= 0) {
      toast.error(
        t("trip_overview.budget_expense_invalid", { defaultValue: "Enter a valid expense amount" }),
      );
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(
        t("trip_overview.budget_expense_title_required", {
          defaultValue: "Add a short title",
        }),
      );
      return;
    }
    setAdding(true);
    try {
      await createTripExpense(trip.id, {
        amount_minor: minor,
        currency_code: expCurrency.toUpperCase(),
        title: trimmedTitle,
        notes: null,
        category: category.trim() || null,
        location_id: locationId || null,
        activity_id: activityId || null,
      });
      toast.success(t("trip_overview.budget_expense_added", { defaultValue: "Expense added" }));
      setAmountMajor("");
      setTitle("");
      setCategory("");
      setLocationId("");
      setActivityId("");
      onExpensesChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTripExpense(trip.id, id);
      toast.success(t("trip_overview.budget_expense_deleted", { defaultValue: "Removed" }));
      onExpensesChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      console.error(e);
    }
  };

  const activitiesFiltered = locationId
    ? allActivities.filter((a) => a.location_id === locationId)
    : allActivities;

  const categoryChips: {
    id: (typeof BUDGET_CATEGORIES)[number] | "";
    icon: typeof Utensils;
  }[] = [
    { id: "food", icon: Utensils },
    { id: "transport", icon: Bus },
    { id: "lodging", icon: Bed },
    { id: "activities", icon: Ticket },
    { id: "other", icon: CircleDot },
  ];

  const hasCap = budgetCapMinor != null && budgetCurrency != null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {loadError ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain py-1 pb-6 [touch-action:pan-y]">
        {/* Spending snapshot */}
        <section className="glass-panel shadow-none relative overflow-hidden rounded-3xl">
          <div className="space-y-4 px-4 py-6 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("trip_budget.spent_so_far", { defaultValue: "Spent on this trip" })}
              </p>
              <p className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                {loading && expenses.length === 0 ? (
                  <span className="inline-block h-12 w-40 animate-pulse rounded-lg bg-white/10" />
                ) : primarySpentLabel ? (
                  primarySpentLabel
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("trip_budget.summary_tagline", {
                  defaultValue: "Add things as you go — dinners, trains, rooms, tickets.",
                })}
              </p>
            </div>
            {hasCap ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    {t("trip_budget.summary_cap_of", {
                      defaultValue: "Cap of {{amount}}",
                      amount: formatMoneyMinor(budgetCapMinor, budgetCurrency),
                    })}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {progressPct != null ? (
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(progressPct)}%
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPlanningOpen(true)}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("trip_budget.adjust_limit", { defaultValue: "Adjust" })}
                    </button>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      progressPct != null && progressPct > 100
                        ? "bg-destructive"
                        : progressPct != null && progressPct > 85
                          ? "bg-amber-500"
                          : "bg-primary",
                    )}
                    style={{ width: `${progressPct ?? 0}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Quick add */}
        <section className="glass-panel shadow-none relative overflow-hidden rounded-3xl">
          <div className="space-y-4 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {t("trip_budget.log_purchase_title", { defaultValue: "Log a purchase" })}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("trip_budget.add_purchase_short_hint", {
                  defaultValue: "How much, and what it was.",
                })}
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Input
                type="text"
                inputMode="decimal"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                placeholder={
                  minorUnitDivisor(expCurrency) === 1 ? "12" : "12.50"
                }
                aria-label={t("trip_overview.budget_amount", { defaultValue: "Amount" })}
                className={cn(
                  "min-w-0 flex-1 rounded-xl text-3xl font-semibold tabular-nums sm:text-4xl",
                  "h-14 sm:h-16",
                  INPUT_GLASS,
                )}
              />
              <label className="sr-only" htmlFor="exp-cur-compact">
                {t("trip_budget.currency_picker_a11y", {
                  defaultValue: "Currency for this purchase",
                })}
              </label>
              <select
                id="exp-cur-compact"
                value={expCurrency}
                onChange={(e) => setExpCurrency(e.target.value)}
                className={SELECT_COMPACT}
              >
                {PRESET_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("trip_budget.what_was_it_placeholder", {
                defaultValue: "Coffee near the museum, night train, hotel night two…",
              })}
              aria-label={t("trip_budget.what_was_it", { defaultValue: "What was it?" })}
              className={cn("h-12 rounded-xl text-base", INPUT_GLASS)}
            />

            <Button
              type="button"
              size="lg"
              disabled={adding}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-none sm:h-14"
              onClick={() => void handleAddExpense()}
            >
              {adding
                ? t("common.saving", { defaultValue: "Saving…" })
                : t("trip_budget.add_to_trip_cta", { defaultValue: "Add to trip spending" })}
            </Button>

            <button
              type="button"
              onClick={() => setExpenseDetailsOpen((o) => !o)}
              aria-expanded={expenseDetailsOpen}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
            >
              {expenseDetailsOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {t("trip_budget.hide_options", { defaultValue: "Hide extra fields" })}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {t("trip_budget.more_options", {
                    defaultValue: "More — category, stop, activity",
                  })}
                </>
              )}
            </button>

            {expenseDetailsOpen ? (
              <div className="space-y-4 border-t border-border/30 pt-4 dark:border-white/10">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("trip_budget.category_label", { defaultValue: "Category" })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={category === "" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 rounded-full border-dashed border-border/60 bg-background/40 px-4 shadow-none backdrop-blur-sm dark:border-white/15 dark:bg-white/5",
                      )}
                      onClick={() => setCategory("")}
                    >
                      {t("trip_budget.category_skip", { defaultValue: "No category" })}
                    </Button>
                    {categoryChips.map(({ id, icon: Icon }) => (
                      <Button
                        key={id || "none"}
                        type="button"
                        variant={category === id ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-9 gap-1.5 rounded-full border-border/60 px-3.5 shadow-none backdrop-blur-sm dark:border-white/15",
                          category !== id && "bg-background/40 dark:bg-white/5",
                        )}
                        onClick={() => setCategory(id)}
                      >
                        <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden />
                        {t(`trip_overview.budget_cat_${id}`, { defaultValue: id })}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="exp-stop"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {t("trip_overview.budget_stop", { defaultValue: "Stop (optional)" })}
                  </label>
                  <select
                    id="exp-stop"
                    value={locationId}
                    onChange={(e) => {
                      setLocationId(e.target.value);
                      setActivityId("");
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {t("trip_overview.budget_whole_trip", { defaultValue: "Whole trip" })}
                    </option>
                    {routeLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.location_name?.trim() || loc.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="exp-act"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {t("trip_overview.budget_activity", { defaultValue: "Activity (optional)" })}
                  </label>
                  <select
                    id="exp-act"
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {t("trip_overview.budget_no_activity", { defaultValue: "None" })}
                    </option>
                    {activitiesFiltered.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Expense list */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("trip_budget.your_spending", { defaultValue: "Your spending" })}
            </h2>
          </div>
          {loading ? (
            <ul className="space-y-3">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="glass-panel shadow-none h-20 animate-pulse rounded-2xl opacity-60"
                />
              ))}
            </ul>
          ) : expenses.length === 0 ? (
            <div className="glass-panel shadow-none relative overflow-hidden rounded-3xl border border-dashed border-border/50 py-10 dark:border-white/15">
              <div className="px-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t("trip_budget.empty_spending_title", { defaultValue: "Nothing logged yet" })}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("trip_budget.empty_spending_body", {
                    defaultValue: "When you grab a meal or book a ride, add it above — your total updates here.",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {expenses.map((ex) => (
                <li key={ex.id}>
                  <div className="glass-panel shadow-none flex overflow-hidden rounded-2xl">
                    <div
                      className={cn("w-1 shrink-0 self-stretch", categoryBarBg(ex.category))}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-3 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-base font-semibold leading-snug text-foreground">
                            {ex.title}
                          </p>
                          {ex.category ? (
                            <p className="text-xs capitalize text-muted-foreground">
                              {t(`trip_overview.budget_cat_${ex.category}`, {
                                defaultValue: ex.category,
                              })}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                          <p className="text-right text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
                            {formatMoneyMinor(ex.amount_minor, ex.currency_code)}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                              aria-label={t("common.edit", { defaultValue: "Edit" })}
                              onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t("common.delete", { defaultValue: "Delete" })}
                              onClick={() => void handleDelete(ex.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {editingId === ex.id ? (
                        <div className="border-t border-border/40 pt-3 dark:border-white/10">
                          <ExpenseInlineEdit
                            tripId={trip.id}
                            expense={ex}
                            onDone={() => {
                              setEditingId(null);
                              onExpensesChanged();
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Optional cap — disclosed */}
        {planningOpen ? (
          <section className="glass-panel shadow-none relative overflow-hidden rounded-3xl border border-border/40 dark:border-white/12">
            <div className="flex items-start justify-between gap-3 border-b border-border/30 px-4 pb-3 pt-4 sm:px-6 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {t("trip_budget.planning_section_title", { defaultValue: "Planning budget" })}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("trip_budget.planning_section_hint", {
                    defaultValue: "Optional: set one total in a single currency to compare with spending above.",
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-lg text-muted-foreground shadow-none"
                onClick={() => setPlanningOpen(false)}
              >
                {t("trip_budget.done_planning", { defaultValue: "Done" })}
              </Button>
            </div>
            <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="cap-amt" className="text-xs font-medium text-muted-foreground">
                    {t("trip_overview.budget_amount", { defaultValue: "Amount" })}
                  </Label>
                  <Input
                    id="cap-amt"
                    type="text"
                    inputMode="decimal"
                    value={budgetMajor}
                    onChange={(e) => setBudgetMajor(e.target.value)}
                    placeholder={
                      minorUnitDivisor(budgetCurrencyInput) === 1 ? "2000" : "2000.00"
                    }
                    className={cn("h-11 w-full rounded-xl sm:w-36", INPUT_GLASS)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cap-cur" className="text-xs font-medium text-muted-foreground">
                    {t("trip_overview.budget_currency", { defaultValue: "Currency" })}
                  </Label>
                  <select
                    id="cap-cur"
                    value={budgetCurrencyInput}
                    onChange={(e) => setBudgetCurrencyInput(e.target.value)}
                    className={cn(SELECT_CLASS, "sm:w-36")}
                  >
                    {PRESET_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl shadow-none"
                    disabled={savingBudget}
                    onClick={() => void handleSaveTripBudget()}
                  >
                    {t("trip_overview.budget_save_cap", { defaultValue: "Save cap" })}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-border/60 bg-background/30 shadow-none backdrop-blur-sm dark:border-white/15 dark:bg-white/5"
                    disabled={savingBudget}
                    onClick={() => void handleClearTripBudget()}
                  >
                    {t("trip_overview.budget_clear_cap", { defaultValue: "Clear" })}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setPlanningOpen(true)}
            className="w-full rounded-2xl border border-dashed border-border/50 bg-background/20 px-4 py-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background/40 hover:text-foreground dark:border-white/12 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
          >
            {hasCap
              ? t("trip_budget.change_spending_limit", { defaultValue: "Change spending limit" })
              : t("trip_budget.set_spending_limit", {
                  defaultValue: "Set a spending limit (optional)",
                })}
          </button>
        )}
      </div>
    </div>
  );
}

function ExpenseInlineEdit({
  tripId,
  expense,
  onDone,
}: {
  tripId: string;
  expense: TripExpense;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [major, setMajor] = useState(() => {
    const d = minorUnitDivisor(expense.currency_code);
    return (expense.amount_minor / d).toFixed(d === 1 ? 0 : 2);
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const minor = parseMajorToMinor(major.trim(), expense.currency_code);
    if (minor === null || minor <= 0) {
      toast.error(
        t("trip_overview.budget_expense_invalid", { defaultValue: "Enter a valid expense amount" }),
      );
      return;
    }
    setBusy(true);
    try {
      await updateTripExpense(tripId, expense.id, { amount_minor: minor });
      toast.success(t("common.saved", { defaultValue: "Saved" }));
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const amountLabel = t("trip_overview.budget_amount", { defaultValue: "Amount" });

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <Input
        type="text"
        inputMode="decimal"
        value={major}
        onChange={(e) => setMajor(e.target.value)}
        aria-label={amountLabel}
        className={cn("h-10 w-32 rounded-xl tabular-nums", INPUT_GLASS)}
      />
      <Button type="button" size="sm" className="rounded-xl shadow-none" disabled={busy} onClick={() => void save()}>
        {t("common.save", { defaultValue: "Save" })}
      </Button>
    </div>
  );
}
