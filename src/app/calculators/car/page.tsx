import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { CarScenarioForm } from "@/components/scenarios/car-scenario-form";
import { CarScenarioList } from "@/components/scenarios/car-scenario-list";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default async function CarCalculatorPage() {
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
      .from("car_scenarios")
      .select(
        "id, name, price, deposit, apr, term_months, insurance_annual, road_tax_annual, fuel_maintenance_monthly, mot_due_date, lease_monthly_quote, linked_goal_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("goals").select("id, name").eq("owner_id", user.id).order("priority", { ascending: true }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">Car cost calculator</h1>
        <p className="text-sm text-foreground-muted">
          Compare finance and running costs across scenarios. MOT is a reminder only — see the total for what
          actually costs money each month.
        </p>
      </div>

      <CarScenarioList
        scenarios={(scenarios ?? []).map((s) => ({
          ...s,
          price: Number(s.price),
          deposit: Number(s.deposit),
          apr: Number(s.apr),
          insurance_annual: Number(s.insurance_annual),
          road_tax_annual: Number(s.road_tax_annual),
          fuel_maintenance_monthly: Number(s.fuel_maintenance_monthly),
          lease_monthly_quote: s.lease_monthly_quote === null ? null : Number(s.lease_monthly_quote),
        }))}
        goals={goals ?? []}
        currency={currency}
      />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">New scenario</h2>
        <CarScenarioForm />
      </section>
    </div>
  );
}
