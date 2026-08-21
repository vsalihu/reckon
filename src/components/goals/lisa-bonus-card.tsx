import { calculateLisaBonus, type LisaContribution } from "@/lib/lisa";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function LisaBonusCard({ contributions, currency }: { contributions: LisaContribution[]; currency: CurrencyCode }) {
  const bonus = calculateLisaBonus(contributions);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 font-display text-lg text-foreground">LISA bonus</h2>
      <p className="mb-4 text-sm text-foreground-muted">
        25% government bonus, up to £4,000 of contributions per tax year (max £1,000 bonus/year).
      </p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-numeric text-sm">
        <dt className="text-foreground-muted">Contributed (all time)</dt>
        <dd className="text-right text-foreground">{formatCurrency(bonus.totalContributed, currency)}</dd>
        <dt className="text-foreground-muted">Bonus earned</dt>
        <dd className="text-right text-positive">{formatCurrency(bonus.totalBonus, currency)}</dd>
        <dt className="border-t border-border pt-1 font-medium text-foreground">Total available</dt>
        <dd className="border-t border-border pt-1 text-right font-medium text-foreground">
          {formatCurrency(bonus.totalAvailable, currency)}
        </dd>
      </dl>

      {bonus.byTaxYear.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-foreground-muted">By tax year</p>
          <ul className="flex flex-col gap-1 font-numeric text-xs">
            {bonus.byTaxYear.map((year) => (
              <li key={year.taxYear} className="flex items-center justify-between text-foreground-muted">
                <span>{year.taxYear}</span>
                <span>
                  {formatCurrency(year.contributed, currency)} → +{formatCurrency(year.bonus, currency)}
                  {year.exceededAnnualLimit ? " (limit reached)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-foreground-muted">
        Property price limit £450,000; account must be open 12 months before a penalty-free first-home withdrawal.
      </p>
    </div>
  );
}
