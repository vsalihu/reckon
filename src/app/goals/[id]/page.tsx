import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { ProgressGauge } from "@/components/progress-gauge";
import { WhatIfSlider } from "@/components/goals/what-if-slider";
import { calculateSuggestedContribution } from "@/lib/goals/suggested-contribution";
import { calculateGoalStreak } from "@/lib/goals/streak";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default async function GoalDetailPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding/currency");
  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const { data: goal } = await supabase
    .from("goals")
    .select("id, name, target_amount, deadline, created_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!goal) notFound();

  const { data: contributions } = await supabase
    .from("goal_contributions")
    .select("amount, contributed_at")
    .eq("goal_id", goal.id)
    .eq("user_id", user.id);

  const targetAmount = Number(goal.target_amount);
  const contributedTotal = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const remainingAmount = targetAmount - contributedTotal;

  const suggestion = calculateSuggestedContribution({
    targetAmount,
    alreadyContributed: contributedTotal,
    deadline: new Date(goal.deadline),
  });

  const streak = calculateGoalStreak({
    targetAmount,
    createdAt: new Date(goal.created_at),
    deadline: new Date(goal.deadline),
    contributions: (contributions ?? []).map((c) => ({ amount: Number(c.amount), contributedAt: new Date(c.contributed_at) })),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <Link href="/dashboard" className="text-sm text-foreground-muted hover:text-accent">
          ← Back to goals
        </Link>
        <h1 className="mt-1 font-display text-2xl text-foreground">{goal.name}</h1>
        <p className="text-sm text-foreground-muted">
          Deadline {new Date(goal.deadline).toLocaleDateString("en-GB")}
          {streak.currentStreakWeeks > 0 ? ` · 🔥 ${streak.currentStreakWeeks}-week streak` : ""}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <ProgressGauge current={contributedTotal} target={targetAmount} currency={currency} label="Funded" />
      </section>

      <WhatIfSlider remainingAmount={remainingAmount} suggestedWeekly={suggestion.weeklyAmount} currency={currency} />
    </div>
  );
}
