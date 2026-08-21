"use client";

import { useActionState, useState } from "react";
import { logRoundUpContribution } from "@/lib/spending/actions";
import { calculateRoundUp } from "@/lib/spending/round-up";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { ActionState } from "@/lib/shared/action-state";

export interface GoalOption {
  id: string;
  name: string;
}

export function RoundUpControl({
  spendingLabel,
  amount,
  goals,
  currency,
}: {
  spendingLabel: string;
  amount: number;
  goals: GoalOption[];
  currency: CurrencyCode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(logRoundUpContribution, {});

  const roundUp = calculateRoundUp(amount);
  const roundedAmount = Math.round((amount + roundUp) * 100) / 100;

  if (roundUp <= 0 || goals.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-accent hover:underline"
      >
        Round up +{formatCurrency(roundUp, currency)}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="round_up_amount" value={roundUp} />
      <input type="hidden" name="spending_label" value={spendingLabel} />
      <input type="hidden" name="original_amount" value={amount} />
      <input type="hidden" name="rounded_amount" value={roundedAmount} />
      <span className="text-xs text-foreground-muted">
        Add {formatCurrency(roundUp, currency)} to
      </span>
      <select
        name="goal_id"
        required
        aria-label="Round up to goal"
        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-accent"
      >
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-foreground-muted hover:text-negative">
        Cancel
      </button>
      {state.error ? <p className="w-full text-xs text-negative">{state.error}</p> : null}
    </form>
  );
}
