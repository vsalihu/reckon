import { calculateUkTakeHome } from "@/lib/tax";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function TakeHomeCard({ grossAnnual, currency }: { grossAnnual: number; currency: CurrencyCode }) {
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

  const estimate = calculateUkTakeHome(grossAnnual);

  const rows: { label: string; annual: number; monthly: number }[] = [
    { label: "Gross", annual: estimate.grossAnnual, monthly: estimate.grossAnnual / 12 },
    { label: "Income Tax", annual: -estimate.incomeTaxAnnual, monthly: -estimate.incomeTaxAnnual / 12 },
    { label: "National Insurance", annual: -estimate.employeeNiAnnual, monthly: -estimate.employeeNiAnnual / 12 },
    { label: "Net (take-home)", annual: estimate.netAnnual, monthly: estimate.netMonthly },
  ];

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

      <p className="mt-4 text-xs text-foreground-muted">
        Estimate only — assumes a single PAYE employment with no student loan, pension, or salary-sacrifice deductions.
      </p>
    </div>
  );
}
