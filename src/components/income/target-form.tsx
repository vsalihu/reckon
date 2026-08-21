"use client";

import { useActionState } from "react";
import { setIncomeTarget } from "@/lib/income/actions";
import { SubmitButton } from "@/components/submit-button";

export function TargetForm({ currentAmount }: { currentAmount?: number }) {
  const [state, action] = useActionState(setIncomeTarget, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="annual_gross_amount" className="mb-1.5 block text-sm text-foreground-muted">
          Annual gross income target
        </label>
        <input
          id="annual_gross_amount"
          name="annual_gross_amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={currentAmount}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>{currentAmount ? "Update target" : "Set target"}</SubmitButton>
    </form>
  );
}
