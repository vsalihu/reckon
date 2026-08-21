"use client";

import { useActionState } from "react";
import { setPensionContribution } from "@/lib/income/actions";
import { SubmitButton } from "@/components/submit-button";

export function PensionSettingForm({ currentPercent }: { currentPercent: number }) {
  const [state, action] = useActionState(setPensionContribution, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="pension_contribution_percent" className="mb-1.5 block text-sm text-foreground-muted">
          Pension contribution (% of PAYE gross)
        </label>
        <input
          id="pension_contribution_percent"
          name="pension_contribution_percent"
          type="number"
          min="0"
          max="100"
          step="0.1"
          required
          defaultValue={currentPercent}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
        <p className="mt-1 text-xs text-foreground-muted">
          Applies to PAYE income only — a simple flat percentage, not full salary-sacrifice or annual-allowance
          modelling. Self-employed pension contributions work differently and aren&apos;t covered here.
        </p>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
