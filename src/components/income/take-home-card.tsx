import { calculateMixedIncomeTakeHome } from "@/lib/tax";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { PensionSettingForm } from "@/components/income/pension-setting-form";

export function TakeHomeCard({
  payeGross,
  selfEmployedProfit,
  pensionContributionPercent,
  currency,
}: {
  payeGross: number;
  selfEmployedProfit: number;
  pensionContributionPercent: number;
  currency: CurrencyCode;
}) {
  if (currency !== "GBP") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">UK take-home estimate</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Only available for GBP accounts — UK Income Tax and National Insurance don&apos;t apply to {currency}
          figures.
        </p>
      </div>
    );
  }

  if (payeGross === 0 && selfEmployedProfit === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg text-foreground">UK take-home estimate</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Log a pay entry to see your take-home estimate for this tax year, combining PAYE and self-employed income.
        </p>
      </div>
    );
  }

  const estimate = calculateMixedIncomeTakeHome({
    payeGross,
    selfEmployedProfit,
    pensionContributionPercent,
  });

  const rows: { label: string; annual: number; monthly: number }[] = [
    { label: "Gross (PAYE)", annual: estimate.payeGross, monthly: estimate.payeGross / 12 },
    { label: "Gross (self-employed)", annual: estimate.selfEmployedProfit, monthly: estimate.selfEmployedProfit / 12 },
    { label: "Income Tax", annual: -estimate.incomeTaxAnnual, monthly: -estimate.incomeTaxAnnual / 12 },
    {
      label: "National Insurance (Class 1 + 4)",
      annual: -(estimate.class1EmployeeNiAnnual + estimate.class4NiAnnual),
      monthly: -(estimate.class1EmployeeNiAnnual + estimate.class4NiAnnual) / 12,
    },
  ];

  if (estimate.pensionDeductionAnnual > 0) {
    rows.push({
      label: "Pension contribution",
      annual: -estimate.pensionDeductionAnnual,
      monthly: -estimate.pensionDeductionAnnual / 12,
    });
  }

  rows.push({ label: "Net (take-home)", annual: estimate.netAnnual, monthly: estimate.netMonthly });

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg text-foreground">UK take-home estimate</h2>
        <span className="text-xs text-foreground-muted">{estimate.taxYear}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2 text-xs text-foreground-muted">
          <span />
          <span className="text-right">Annual</span>
          <span className="text-right">Monthly</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-3 gap-2 font-numeric text-sm ${
              row.label === "Net (take-home)" ? "border-t border-border pt-2 font-medium text-foreground" : "text-foreground-muted"
            }`}
          >
            <span className={row.label === "Net (take-home)" ? "text-foreground" : ""}>{row.label}</span>
            <span className="text-right">{formatCurrency(row.annual, currency)}</span>
            <span className="text-right">{formatCurrency(row.monthly, currency)}</span>
          </div>
        ))}
      </div>

      {estimate.class2.voluntaryAvailable ? (
        <p className="mt-3 rounded-lg border border-border px-3 py-2 text-xs text-foreground-muted">
          Your self-employed profit is below £6,845, so Class 2 NI isn&apos;t charged automatically. You can
          optionally pay {formatCurrency(estimate.class2.voluntaryAnnual, currency)}/year voluntarily to protect
          your State Pension record — not included in the estimate above.
        </p>
      ) : null}

      <p className="mt-3 text-xs text-foreground-muted">
        Estimate only — combines PAYE and self-employed income for Income Tax (one Personal Allowance, shared
        bands) but calculates National Insurance separately per income type, per current 2025/26 rules. Doesn&apos;t
        model allowable expenses, the trading allowance, or student loan repayments.
      </p>

      <details className="mt-4">
        <summary data-testid="toggle-pension-form" className="cursor-pointer text-sm text-accent">
          {pensionContributionPercent > 0 ? "Update pension contribution" : "Set pension contribution"}
        </summary>
        <div className="mt-3">
          <PensionSettingForm currentPercent={pensionContributionPercent} />
        </div>
      </details>
    </div>
  );
}
