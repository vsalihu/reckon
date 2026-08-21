"use client";

import { useMemo, useState } from "react";
import { calculateWhatIfProjection, type ContributionPeriod } from "@/lib/goals/what-if";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

/**
 * Purely client-side, exploratory — no save, no server round trip. Moving
 * the slider just re-runs the reverse formula and re-renders the
 * projected date, per the brief.
 */
export function WhatIfSlider({
  remainingAmount,
  suggestedWeekly,
  currency,
}: {
  remainingAmount: number;
  suggestedWeekly: number;
  currency: CurrencyCode;
}) {
  const [period, setPeriod] = useState<ContributionPeriod>("weekly");
  const initialAmount = Math.max(1, Math.round(suggestedWeekly));
  const [amount, setAmount] = useState(initialAmount);

  // Slider range: 0 up to roughly 3x the suggested pace (or a sensible
  // floor if the goal is nearly/already funded) — generous enough to
  // explore "what if I paid this off much faster" without feeling capped.
  const maxAmount = Math.max(10, Math.round(suggestedWeekly * 3) || 100);

  const projection = useMemo(
    () => calculateWhatIfProjection({ remainingAmount, contributionAmount: amount, period, now: new Date() }),
    [remainingAmount, amount, period],
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 font-display text-lg text-foreground">What if?</h2>

      <div className="mb-4 inline-flex rounded-full border border-border p-1">
        {(["weekly", "monthly"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              period === option ? "bg-accent text-accent-foreground" : "text-foreground-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <label htmlFor="what-if-amount" className="mb-1.5 block text-sm text-foreground-muted">
        {formatCurrency(amount, currency)} per {period === "weekly" ? "week" : "month"}
      </label>
      <input
        id="what-if-amount"
        type="range"
        min={0}
        max={maxAmount}
        step={1}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        className="w-full accent-accent"
      />

      <p className="mt-4 font-numeric text-sm text-foreground">
        {remainingAmount <= 0
          ? "Already funded."
          : projection.projectedDate
            ? `Done by ${projection.projectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} (${projection.periodsToComplete} ${period === "weekly" ? "weeks" : "months"}).`
            : "At £0, this goal never completes — try moving the slider."}
      </p>
    </div>
  );
}
