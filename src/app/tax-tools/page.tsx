import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { PayslipComparisonForm } from "@/components/tax/payslip-comparison-form";
import { PayRiseForm } from "@/components/tax/pay-rise-form";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default async function TaxToolsPage() {
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
  const pensionContributionPercent = Number(profile.pension_contribution_percent ?? 0);

  const { data: entries } = await supabase
    .from("income_entries")
    .select("amount, employment_type")
    .eq("user_id", user.id);

  const payeGross = (entries ?? [])
    .filter((e) => e.employment_type === "paye")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const selfEmployedProfit = (entries ?? [])
    .filter((e) => e.employment_type === "self_employed")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">Tax tools</h1>
        <p className="text-sm text-foreground-muted">Sanity-check a real payslip, or explore a pay rise.</p>
      </div>

      {currency !== "GBP" ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-foreground-muted">
            Only available for GBP accounts — UK Income Tax and National Insurance don&apos;t apply to {currency}
            figures.
          </p>
        </div>
      ) : (
        <>
          <PayslipComparisonForm pensionContributionPercent={pensionContributionPercent} currency={currency} />
          <PayRiseForm
            currentPayeGross={payeGross}
            selfEmployedProfit={selfEmployedProfit}
            pensionContributionPercent={pensionContributionPercent}
            currency={currency}
          />
        </>
      )}
    </div>
  );
}
