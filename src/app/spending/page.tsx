import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { CategoryForm } from "@/components/spending/category-form";
import { CategoryList } from "@/components/spending/category-list";
import { SpendingEntryForm } from "@/components/spending/entry-form";
import { SpendingEntryList } from "@/components/spending/entry-list";
import { BudgetRuleCard } from "@/components/spending/budget-rule-card";
import { RecurringBillForm } from "@/components/recurring-bills/recurring-bill-form";
import { RecurringBillList } from "@/components/recurring-bills/recurring-bill-list";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { calculateMixedIncomeTakeHome } from "@/lib/tax";

export default async function SpendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, pension_contribution_percent")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding/currency");

  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const [{ data: categories }, { data: entries }, { data: goals }, { data: incomeEntries }, { data: contributions }, { data: bills }] =
    await Promise.all([
      supabase.from("spending_categories").select("id, name, budget_group").eq("user_id", user.id).order("name", { ascending: true }),
      supabase
        .from("spending_entries")
        .select("id, label, amount, entry_date, category_id, category_name_snapshot")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false }),
      supabase.from("goals").select("id, name").eq("owner_id", user.id).order("priority", { ascending: true }),
      supabase.from("income_entries").select("amount, employment_type").eq("user_id", user.id),
      supabase.from("goal_contributions").select("amount").eq("user_id", user.id),
      supabase.from("recurring_bills").select("id, name, amount, frequency, next_due_date").eq("user_id", user.id).order("next_due_date"),
    ]);

  const entriesWithAmount = (entries ?? []).map((e) => ({ ...e, amount: Number(e.amount) }));
  const total = entriesWithAmount.reduce((sum, e) => sum + e.amount, 0);

  // 50/30/20 inputs
  const budgetGroupByCategoryId = new Map((categories ?? []).map((c) => [c.id, c.budget_group]));
  const needsSpent = entriesWithAmount
    .filter((e) => e.category_id && budgetGroupByCategoryId.get(e.category_id) === "needs")
    .reduce((sum, e) => sum + e.amount, 0);
  const wantsSpent = entriesWithAmount
    .filter((e) => e.category_id && budgetGroupByCategoryId.get(e.category_id) === "wants")
    .reduce((sum, e) => sum + e.amount, 0);
  const savingsSpentTagged = entriesWithAmount
    .filter((e) => e.category_id && budgetGroupByCategoryId.get(e.category_id) === "savings")
    .reduce((sum, e) => sum + e.amount, 0);
  const goalContributionsTotal = (contributions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  const payeGross = (incomeEntries ?? []).filter((e) => e.employment_type === "paye").reduce((s, e) => s + Number(e.amount), 0);
  const selfEmployedProfit = (incomeEntries ?? [])
    .filter((e) => e.employment_type === "self_employed")
    .reduce((s, e) => s + Number(e.amount), 0);
  const afterTaxIncome =
    currency === "GBP"
      ? calculateMixedIncomeTakeHome({
          payeGross,
          selfEmployedProfit,
          pensionContributionPercent: Number(profile.pension_contribution_percent ?? 0),
        }).netAnnual
      : payeGross + selfEmployedProfit; // no UK tax model outside GBP — see docs/budget-rule.md

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">Spending</h1>
        <p className="text-sm text-foreground-muted">Categories are entirely up to you — create whatever fits.</p>
      </div>

      <BudgetRuleCard
        input={{ afterTaxIncome, needsSpent, wantsSpent, savingsTotal: goalContributionsTotal + savingsSpentTagged }}
        currency={currency}
      />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Categories</h2>
        <CategoryList categories={categories ?? []} />
        <div className="mt-4">
          <CategoryForm />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Log spending</h2>
        <SpendingEntryForm categories={categories ?? []} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-foreground">Entries</h2>
          <span className="font-numeric text-sm text-foreground-muted">
            {new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(total)} total
          </span>
        </div>
        <SpendingEntryList entries={entriesWithAmount} goals={goals ?? []} currency={currency} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Recurring bills</h2>
        <RecurringBillList
          bills={(bills ?? []).map((b) => ({ ...b, amount: Number(b.amount) }))}
          currency={currency}
          now={new Date()}
        />
        <div className="mt-4">
          <RecurringBillForm />
        </div>
      </section>
    </div>
  );
}
