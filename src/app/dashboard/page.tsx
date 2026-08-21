import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { AppHeader } from "@/components/app-header";
import { ProgressGauge } from "@/components/progress-gauge";
import { TargetForm } from "@/components/income/target-form";
import { EntryForm } from "@/components/income/entry-form";
import { EntryList } from "@/components/income/entry-list";
import { TakeHomeCard } from "@/components/income/take-home-card";
import { CreateGoalForm } from "@/components/goals/create-goal-form";
import { GoalList } from "@/components/goals/goal-list";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { CURRENT_UK_TAX_YEAR } from "@/lib/tax";
import { evaluateGoals } from "@/lib/goals/evaluate-goals";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();

  if (!profile) redirect("/onboarding/currency");

  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const [{ data: target }, { data: entries }, { data: goals }, { data: contributions }] = await Promise.all([
    supabase
      .from("income_targets")
      .select("annual_gross_amount")
      .eq("user_id", user.id)
      .eq("tax_year", CURRENT_UK_TAX_YEAR.taxYear)
      .maybeSingle(),
    supabase
      .from("income_entries")
      .select("id, label, amount, entry_date")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("goals")
      .select("id, name, target_amount, deadline, priority, created_at, celebrated_milestones")
      .eq("owner_id", user.id)
      .order("priority", { ascending: true }),
    supabase.from("goal_contributions").select("goal_id, amount, contributed_at").eq("user_id", user.id),
  ]);

  const loggedTotal = (entries ?? []).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const annualGrossTarget = target ? Number(target.annual_gross_amount) : 0;

  const goalStatuses = evaluateGoals({
    goals: (goals ?? []).map((g) => ({
      id: g.id,
      target_amount: Number(g.target_amount),
      deadline: g.deadline,
      created_at: g.created_at,
    })),
    contributions: (contributions ?? []).map((c) => ({
      goal_id: c.goal_id,
      amount: Number(c.amount),
      contributed_at: c.contributed_at,
    })),
    incomeEntries: (entries ?? []).map((e) => ({ amount: Number(e.amount), entry_date: e.entry_date })),
    annualGrossTarget,
  });
  const statusByGoalId = new Map(goalStatuses.map((s) => [s.goalId, s]));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Income this tax year</h2>
        {target ? (
          <ProgressGauge
            current={loggedTotal}
            target={annualGrossTarget}
            currency={currency}
            label={`Logged toward your ${CURRENT_UK_TAX_YEAR.taxYear} target`}
          />
        ) : (
          <p className="mb-3 text-sm text-foreground-muted">Set your annual gross target to see progress here.</p>
        )}
        <details className="mt-4">
          <summary data-testid="toggle-target-form" className="cursor-pointer text-sm text-accent">
            {target ? "Update target" : "Set target"}
          </summary>
          <div className="mt-3">
            <TargetForm currentAmount={target ? annualGrossTarget : undefined} />
          </div>
        </details>
      </section>

      <TakeHomeCard grossAnnual={annualGrossTarget} currency={currency} />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Log a pay entry</h2>
        <EntryForm />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-2 font-display text-lg text-foreground">Pay entries</h2>
        <EntryList entries={entries ?? []} currency={currency} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-foreground">Savings goals</h2>
        <GoalList
          goals={(goals ?? []).map((g) => ({
            id: g.id,
            name: g.name,
            target_amount: Number(g.target_amount),
            deadline: g.deadline,
            created_at: g.created_at,
            celebrated_milestones: g.celebrated_milestones ?? [],
          }))}
          statusByGoalId={statusByGoalId}
          contributions={(contributions ?? []).map((c) => ({
            goal_id: c.goal_id,
            amount: Number(c.amount),
            contributed_at: c.contributed_at,
          }))}
          currency={currency}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">New goal</h2>
        <CreateGoalForm />
      </section>

      <form action={signOut} className="mt-auto">
        <SubmitButton className="border border-border bg-transparent text-foreground hover:border-negative hover:text-negative hover:opacity-100">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
