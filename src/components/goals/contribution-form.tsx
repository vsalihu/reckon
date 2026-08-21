"use client";

import { useActionState } from "react";
import { logContribution } from "@/lib/goals/actions";
import { SubmitButton } from "@/components/submit-button";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

const QUICK_AMOUNTS = [25, 100];

export function ContributionForm({ goalId, currency }: { goalId: string; currency: CurrencyCode }) {
  const symbol = SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const [state, action] = useActionState(logContribution, {});

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Each quick-add button is its own one-click form — no separate confirm step. */}
        {QUICK_AMOUNTS.map((quickAmount) => (
          <form key={quickAmount} action={action}>
            <input type="hidden" name="goal_id" value={goalId} />
            <input type="hidden" name="amount" value={quickAmount} />
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              +{symbol}
              {quickAmount}
            </button>
          </form>
        ))}

        {/* Custom amount is a separate form, requiring the explicit Add click. */}
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="goal_id" value={goalId} />
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Custom"
            className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <SubmitButton className="h-9 w-auto px-4 text-sm">Add</SubmitButton>
        </form>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
    </div>
  );
}
