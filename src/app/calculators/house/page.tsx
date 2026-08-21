import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { HouseScenarioForm } from "@/components/scenarios/house-scenario-form";
import { HouseScenarioList } from "@/components/scenarios/house-scenario-list";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default async function HouseCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding/currency");

  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const [{ data: scenarios }, { data: goals }] = await Promise.all([
    supabase
      .from("house_scenarios")
      .select(
        "id, name, mode, monthly_rent, monthly_bills, council_tax_monthly, loan_amount, interest_rate_apr, term_years, buildings_insurance_annual, council_tax_annual, linked_goal_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("goals").select("id, name").eq("owner_id", user.id).order("priority", { ascending: true }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">House cost calculator</h1>
        <p className="text-sm text-foreground-muted">Compare renting vs buying, or several places, side by side.</p>
      </div>

      <HouseScenarioList
        scenarios={(scenarios ?? []).map((s) => ({
          ...s,
          mode: s.mode as "rent" | "mortgage",
          monthly_rent: s.monthly_rent === null ? null : Number(s.monthly_rent),
          monthly_bills: s.monthly_bills === null ? null : Number(s.monthly_bills),
          council_tax_monthly: s.council_tax_monthly === null ? null : Number(s.council_tax_monthly),
          loan_amount: s.loan_amount === null ? null : Number(s.loan_amount),
          interest_rate_apr: s.interest_rate_apr === null ? null : Number(s.interest_rate_apr),
          buildings_insurance_annual: s.buildings_insurance_annual === null ? null : Number(s.buildings_insurance_annual),
          council_tax_annual: s.council_tax_annual === null ? null : Number(s.council_tax_annual),
        }))}
        goals={goals ?? []}
        currency={currency}
      />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">New scenario</h2>
        <HouseScenarioForm />
      </section>
    </div>
  );
}
