import { calculateBudgetRuleCheck, type BudgetRuleInput } from "@/lib/spending/budget-rule";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function BudgetRuleCard({ input, currency }: { input: BudgetRuleInput; currency: CurrencyCode }) {
  const result = calculateBudgetRuleCheck(input);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 font-display text-lg text-foreground">50/30/20 check</h2>
      <p className="mb-4 text-sm text-foreground-muted">
        Needs / wants / savings against {formatCurrency(result.afterTaxIncome, currency)} after-tax income logged so
        far, using how you&apos;ve tagged your categories below.
      </p>

      {result.afterTaxIncome <= 0 ? (
        <p className="text-sm text-foreground-muted">Log some income to see this check.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {result.buckets.map((bucket) => (
            <div key={bucket.label}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-foreground">
                  {bucket.label} <span className="text-foreground-muted">(target {bucket.targetPercent}%)</span>
                </span>
                <span className="font-numeric text-foreground-muted">
                  {bucket.actualPercent.toFixed(0)}%
                  {Math.abs(bucket.deltaPercentPoints) >= 1
                    ? ` (${bucket.deltaPercentPoints > 0 ? "+" : ""}${bucket.deltaPercentPoints.toFixed(0)}pt)`
                    : ""}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${Math.min(100, bucket.actualPercent)}%` }}
                />
              </div>
              <p className="mt-1 font-numeric text-xs text-foreground-muted">{formatCurrency(bucket.amount, currency)}</p>
            </div>
          ))}
          {result.unaccountedFor !== 0 ? (
            <p className="text-xs text-foreground-muted">
              {formatCurrency(Math.abs(result.unaccountedFor), currency)}{" "}
              {result.unaccountedFor > 0 ? "not yet accounted for" : "over after-tax income"} — untagged spending
              isn&apos;t counted in any bucket above.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
