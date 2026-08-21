"use client";

import { useState, useTransition } from "react";
import { deleteGoal, reorderGoals } from "@/lib/goals/actions";
import { ContributionForm } from "@/components/goals/contribution-form";
import { ProgressGauge } from "@/components/progress-gauge";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { calculateSuggestedContribution } from "@/lib/goals/suggested-contribution";
import type { GoalStatus } from "@/lib/goals/evaluate-goals";

export interface GoalRow {
  id: string;
  name: string;
  target_amount: number;
  deadline: string;
}

const STATUS_LABEL: Partial<Record<GoalStatus["result"]["status"], { text: string; tone: "negative" | "muted" }>> = {
  behind: { text: "Behind pace — contributions aren't keeping up with your income", tone: "negative" },
  overdue: { text: "Deadline has passed", tone: "negative" },
};

export function GoalList({
  goals,
  statusByGoalId,
  currency,
}: {
  goals: GoalRow[];
  statusByGoalId: Map<string, GoalStatus>;
  currency: CurrencyCode;
}) {
  const [orderedGoals, setOrderedGoals] = useState(goals);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when the server sends a fresh goal list (create/delete/revalidate).
  // Adjusting state during render (not in an effect) per React's own
  // guidance for "reset state when a prop changes" — this only fires when
  // `goals` is a genuinely new array from the Server Component parent, not
  // on every render.
  const [prevGoals, setPrevGoals] = useState(goals);
  if (goals !== prevGoals) {
    setPrevGoals(goals);
    setOrderedGoals(goals);
  }

  if (orderedGoals.length === 0) {
    return <p className="text-sm text-foreground-muted">No goals yet — create one below.</p>;
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    const next = [...orderedGoals];
    const fromIndex = next.findIndex((g) => g.id === draggedId);
    const toIndex = next.findIndex((g) => g.id === targetId);
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setOrderedGoals(next);
    setDraggedId(null);
    startTransition(() => {
      reorderGoals(next.map((g) => g.id));
    });
  }

  return (
    <ul className="flex flex-col gap-4">
      {orderedGoals.map((goal) => {
        const status = statusByGoalId.get(goal.id);
        const contributedTotal = status?.contributedTotal ?? 0;
        const statusInfo = status ? STATUS_LABEL[status.result.status] : undefined;
        const suggestion = calculateSuggestedContribution({
          targetAmount: goal.target_amount,
          alreadyContributed: contributedTotal,
          deadline: new Date(goal.deadline),
        });

        return (
          <li
            key={goal.id}
            draggable
            onDragStart={() => setDraggedId(goal.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(goal.id)}
            className="cursor-grab rounded-2xl border border-border bg-surface p-5 active:cursor-grabbing"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-foreground">{goal.name}</p>
                <p className="text-xs text-foreground-muted">
                  Deadline {new Date(goal.deadline).toLocaleDateString("en-GB")} · suggested{" "}
                  {formatCurrency(suggestion.weeklyAmount, currency)}/week
                </p>
              </div>
              <form action={deleteGoal.bind(null, goal.id)}>
                <button
                  type="submit"
                  aria-label={`Delete ${goal.name}`}
                  className="text-foreground-muted transition-colors hover:text-negative"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-7 0v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"
                    />
                  </svg>
                </button>
              </form>
            </div>

            {statusInfo ? (
              <p
                className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                  statusInfo.tone === "negative"
                    ? "border-negative/30 bg-negative/10 text-negative"
                    : "border-border text-foreground-muted"
                }`}
              >
                {statusInfo.text}
              </p>
            ) : null}

            <ProgressGauge
              current={contributedTotal}
              target={goal.target_amount}
              currency={currency}
              label="Funded"
            />

            <div className="mt-4">
              <ContributionForm goalId={goal.id} currency={currency} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
