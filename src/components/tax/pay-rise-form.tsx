"use client";

import { useMemo, useState } from "react";
import { calculatePayRiseImpact } from "@/lib/tax/pay-rise";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function PayRiseForm({
  currentPayeGross,
  selfEmployedProfit,
  pensionContributionPercent,
  currency,
}: {
  currentPayeGross: number;
  selfEmployedProfit: number;
  pensionContributionPercent: number;
  currency: CurrencyCode;
}) {
  const [newPayeGross, setNewPayeGross] = useState(String(Math.round(currentPayeGross * 1.05) || 1000));

  const result = useMemo(() => {
    const parsed = Number(newPayeGross);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return calculatePayRiseImpact({ currentPayeGross, newPayeGross: parsed, selfEmployedProfit, pensionContributionPercent });
  }, [newPayeGross, currentPayeGross, selfEmployedProfit, pensionContributionPercent]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 font-display text-lg text-foreground">Pay rise simulator</h2>
      <p className="mb-4 text-sm text-foreground-muted">
        Based on your current logged PAYE gross of {formatCurrency(currentPayeGross, currency)}/year — shows the
        real extra money in hand, not just the raw increase.
      </p>

      <label htmlFor="new-paye-gross" className="mb-1.5 block text-sm text-foreground-muted">
        New annual PAYE gross
      </label>
      <input
        id="new-paye-gross"
        type="number"
        min="0"
        step="1"
        value={newPayeGross}
        onChange={(event) => setNewPayeGross(event.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
      />

      {result ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-numeric text-sm">
          <dt className="text-foreground-muted">Raw increase</dt>
          <dd className="text-right text-foreground">{formatCurrency(result.grossIncreaseAnnual, currency)}/yr</dd>
          <dt className="border-t border-border pt-1 font-medium text-foreground">Extra take-home</dt>
          <dd className="border-t border-border pt-1 text-right font-medium text-foreground">
            {formatCurrency(result.netIncreaseAnnual, currency)}/yr ({formatCurrency(result.netIncreaseMonthly, currency)}/mo)
          </dd>
          <dt className="text-foreground-muted">Effective rate</dt>
          <dd className="text-right text-foreground-muted">{(result.effectiveRate * 100).toFixed(0)}% reaches take-home</dd>
        </dl>
      ) : null}
    </div>
  );
}
