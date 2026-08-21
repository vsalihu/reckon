"use client";

import { useTransition } from "react";

export interface GoalOption {
  id: string;
  name: string;
}

export function ScenarioGoalLink({
  scenarioId,
  linkedGoalId,
  goals,
  onLink,
  onCreateGoal,
}: {
  scenarioId: string;
  linkedGoalId: string | null;
  goals: GoalOption[];
  onLink: (scenarioId: string, goalId: string | null) => Promise<void>;
  onCreateGoal: (scenarioId: string) => Promise<{ error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    if (value === "__create__") {
      startTransition(() => {
        onCreateGoal(scenarioId);
      });
      return;
    }
    startTransition(() => {
      onLink(scenarioId, value === "" ? null : value);
    });
  }

  return (
    <select
      value={linkedGoalId ?? ""}
      onChange={(event) => handleChange(event.target.value)}
      disabled={isPending}
      aria-label="Linked savings goal"
      className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-60"
    >
      <option value="">No linked goal</option>
      {goals.map((goal) => (
        <option key={goal.id} value={goal.id}>
          {goal.name}
        </option>
      ))}
      <option value="__create__">+ Create new goal from this</option>
    </select>
  );
}
