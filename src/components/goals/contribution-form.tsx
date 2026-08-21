"use client";

import { useActionState, useState } from "react";
import { logContribution } from "@/lib/goals/actions";
import { SubmitButton } from "@/components/submit-button";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

const QUICK_AMOUNTS = [25, 100];

export function ContributionForm({ goalId, currency }: { goalId: string; currency: CurrencyCode }) {
  const symbol = SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const [state, action] = useActionState(logContribution, {});
  const [amount, setAmount] = useState("");

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="goal_id" value={goalId} />
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_AMOUNTS.map((quickAmount) => (
          <button
            key={quickAmount}
            type="button"
            onClick={() => setAmount(String(quickAmount))}
            className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            +{symbol}
            {quickAmount}
          </button>
        ))}
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Custom"
          className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <SubmitButton className="h-9 w-auto px-4 text-sm">Add</SubmitButton>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
    </form>
  );
}
