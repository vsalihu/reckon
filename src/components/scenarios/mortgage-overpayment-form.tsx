"use client";

import { useActionState } from "react";
import { setHouseOverpayment } from "@/lib/scenarios/house-actions";
import { calculateMortgageOverpaymentImpact } from "@/lib/finance/mortgage-overpayment";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { SubmitButton } from "@/components/submit-button";

export interface MortgageScenarioForOverpayment {
  id: string;
  loan_amount: number;
  interest_rate_apr: number;
  term_years: number;
  overpayment_monthly: number | null;
  overpayment_lump_sum: number | null;
  overpayment_lump_sum_month: number | null;
}

export function MortgageOverpaymentForm({
  scenario,
  currency,
}: {
  scenario: MortgageScenarioForOverpayment;
  currency: CurrencyCode;
}) {
  const [state, action] = useActionState(setHouseOverpayment, {});

  const impact = calculateMortgageOverpaymentImpact({
    loanAmount: scenario.loan_amount,
    annualRatePercent: scenario.interest_rate_apr,
    termMonths: scenario.term_years * 12,
    overpaymentMonthly: scenario.overpayment_monthly ?? 0,
    lumpSum: scenario.overpayment_lump_sum ?? 0,
    lumpSumMonth: scenario.overpayment_lump_sum_month ?? undefined,
  });

  const hasOverpayment = (scenario.overpayment_monthly ?? 0) > 0 || (scenario.overpayment_lump_sum ?? 0) > 0;

  return (
    <div className="mt-3">
      {hasOverpayment ? (
        <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 font-numeric text-sm">
          <dt className="text-foreground-muted">Interest saved</dt>
          <dd className="text-right text-positive">{formatCurrency(impact.interestSaved, currency)}</dd>
          <dt className="text-foreground-muted">Time saved</dt>
          <dd className="text-right text-foreground">
            {Math.floor(impact.monthsSaved / 12)}y {impact.monthsSaved % 12}mo
          </dd>
        </dl>
      ) : null}

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="scenario_id" value={scenario.id} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`overpayment-monthly-${scenario.id}`} className="mb-1.5 block text-sm text-foreground-muted">
              Extra / month
            </label>
            <input
              id={`overpayment-monthly-${scenario.id}`}
              name="overpayment_monthly"
              type="number"
              min="0"
              step="0.01"
              defaultValue={scenario.overpayment_monthly ?? 0}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor={`overpayment-lump-${scenario.id}`} className="mb-1.5 block text-sm text-foreground-muted">
              One-off lump sum
            </label>
            <input
              id={`overpayment-lump-${scenario.id}`}
              name="overpayment_lump_sum"
              type="number"
              min="0"
              step="0.01"
              defaultValue={scenario.overpayment_lump_sum ?? 0}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
            />
          </div>
          <div className="col-span-2">
            <label htmlFor={`overpayment-month-${scenario.id}`} className="mb-1.5 block text-sm text-foreground-muted">
              Lump sum paid in month (1 = first payment)
            </label>
            <input
              id={`overpayment-month-${scenario.id}`}
              name="overpayment_lump_sum_month"
              type="number"
              min="1"
              step="1"
              defaultValue={scenario.overpayment_lump_sum_month ?? ""}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
        {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
        <SubmitButton>Update overpayment</SubmitButton>
      </form>
    </div>
  );
}
