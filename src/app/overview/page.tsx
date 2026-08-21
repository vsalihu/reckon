import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { ProgressGauge } from "@/components/progress-gauge";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { CURRENT_UK_TAX_YEAR } from "@/lib/tax";
import { evaluateGoals } from "@/lib/goals/evaluate-goals";
import { calculateCarMonthlyCost } from "@/lib/finance/car-costs";
import { calculateHouseMonthlyCost, type HouseCostInput } from "@/lib/finance/house-costs";
import { formatCurrency } from "@/lib/currency";

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding/currency");

  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const [
    { data: target },
    { data: incomeEntries },
    { data: goals },
    { data: contributions },
    { data: spendingEntries },
    { data: carScenarios },
    { data: houseScenarios },
  ] = await Promise.all([
    supabase
      .from("income_targets")
      .select("annual_gross_amount")
      .eq("user_id", user.id)
      .eq("tax_year", CURRENT_UK_TAX_YEAR.taxYear)
      .maybeSingle(),
    supabase.from("income_entries").select("amount, entry_date").eq("user_id", user.id),
    supabase.from("goals").select("id, name, target_amount, deadline, created_at").eq("owner_id", user.id).order("priority"),
    supabase.from("goal_contributions").select("goal_id, amount, contributed_at").eq("user_id", user.id),
    supabase.from("spending_entries").select("amount, category_name_snapshot").eq("user_id", user.id),
    supabase
      .from("car_scenarios")
      .select("id, name, price, deposit, apr, term_months, insurance_annual, road_tax_annual, fuel_maintenance_monthly")
      .eq("user_id", user.id),
    supabase
      .from("house_scenarios")
      .select(
        "id, name, mode, monthly_rent, monthly_bills, council_tax_monthly, loan_amount, interest_rate_apr, term_years, buildings_insurance_annual, council_tax_annual",
      )
      .eq("user_id", user.id),
  ]);

  const annualGrossTarget = target ? Number(target.annual_gross_amount) : 0;
  const loggedIncomeTotal = (incomeEntries ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

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
    incomeEntries: (incomeEntries ?? []).map((e) => ({ amount: Number(e.amount), entry_date: e.entry_date })),
    annualGrossTarget,
  });
  const statusByGoalId = new Map(goalStatuses.map((s) => [s.goalId, s]));

  const spendingByCategory = new Map<string, number>();
  for (const entry of spendingEntries ?? []) {
    const key = entry.category_name_snapshot;
    spendingByCategory.set(key, (spendingByCategory.get(key) ?? 0) + Number(entry.amount));
  }
  const categoryTotals = Array.from(spendingByCategory, ([name, total]) => ({ name, total }));
  const spendingTotal = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  const carSummaries = (carScenarios ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    totalMonthly: calculateCarMonthlyCost({
      price: Number(s.price),
      deposit: Number(s.deposit),
      apr: Number(s.apr),
      termMonths: s.term_months,
      insuranceAnnual: Number(s.insurance_annual),
      roadTaxAnnual: Number(s.road_tax_annual),
      fuelMaintenanceMonthly: Number(s.fuel_maintenance_monthly),
    }).totalMonthly,
  }));

  const houseSummaries = (houseScenarios ?? []).map((s) => {
    const input: HouseCostInput =
      s.mode === "rent"
        ? {
            mode: "rent",
            monthlyRent: Number(s.monthly_rent ?? 0),
            monthlyBills: Number(s.monthly_bills ?? 0),
            councilTaxMonthly: Number(s.council_tax_monthly ?? 0),
          }
        : {
            mode: "mortgage",
            loanAmount: Number(s.loan_amount ?? 0),
            interestRateApr: Number(s.interest_rate_apr ?? 0),
            termYears: s.term_years ?? 1,
            buildingsInsuranceAnnual: Number(s.buildings_insurance_annual ?? 0),
            councilTaxAnnual: Number(s.council_tax_annual ?? 0),
          };
    return { id: s.id, name: s.name, totalMonthly: calculateHouseMonthlyCost(input).totalMonthly };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">Overview</h1>
        <p className="text-sm text-foreground-muted">Everything in one place.</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Income vs target</h2>
        {target ? (
          <ProgressGauge
            current={loggedIncomeTotal}
            target={annualGrossTarget}
            currency={currency}
            label={`${CURRENT_UK_TAX_YEAR.taxYear} tax year`}
          />
        ) : (
          <p className="text-sm text-foreground-muted">No income target set yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Goals</h2>
        {(goals ?? []).length === 0 ? (
          <p className="text-sm text-foreground-muted">No goals yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {(goals ?? []).map((goal) => {
              const status = statusByGoalId.get(goal.id);
              const contributedTotal = status?.contributedTotal ?? 0;
              const isBehind = status?.result.status === "behind" || status?.result.status === "overdue";
              return (
                <div key={goal.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{goal.name}</span>
                    {isBehind ? <span className="text-xs text-negative">Behind pace</span> : null}
                  </div>
                  <ProgressGauge current={contributedTotal} target={Number(goal.target_amount)} currency={currency} label="" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-foreground">Spending by category</h2>
          <span className="font-numeric text-sm text-foreground-muted">{formatCurrency(spendingTotal, currency)} total</span>
        </div>
        <CategoryBarChart categories={categoryTotals} currency={currency} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Car & house scenarios</h2>
        {carSummaries.length === 0 && houseSummaries.length === 0 ? (
          <p className="text-sm text-foreground-muted">No scenarios yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {carSummaries.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-3">
                <p className="text-xs text-foreground-muted">Car · {s.name}</p>
                <p className="font-numeric text-foreground">{formatCurrency(s.totalMonthly, currency)}/mo</p>
              </div>
            ))}
            {houseSummaries.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-3">
                <p className="text-xs text-foreground-muted">House · {s.name}</p>
                <p className="font-numeric text-foreground">{formatCurrency(s.totalMonthly, currency)}/mo</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
