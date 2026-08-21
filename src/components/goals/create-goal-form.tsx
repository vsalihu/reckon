"use client";

import { useActionState } from "react";
import { createGoal } from "@/lib/goals/actions";
import { SubmitButton } from "@/components/submit-button";

export function CreateGoalForm() {
  const [state, action] = useActionState(createGoal, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="goal-name" className="mb-1.5 block text-sm text-foreground-muted">
          Goal name
        </label>
        <input
          id="goal-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Car deposit"
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="target_amount" className="mb-1.5 block text-sm text-foreground-muted">
            Target amount
          </label>
          <input
            id="target_amount"
            name="target_amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="deadline" className="mb-1.5 block text-sm text-foreground-muted">
            Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            required
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Create goal</SubmitButton>
    </form>
  );
}
