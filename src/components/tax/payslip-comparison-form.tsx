"use client";

import { useState } from "react";
import { comparePayslip, type PayslipPeriod, type PayslipComparisonResult } from "@/lib/tax/payslip-comparison";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { SubmitButton } from "@/components/submit-button";

const STATUS_MESSAGE: Record<PayslipComparisonResult["status"], string> = {
  match: "Matches our estimate within a reasonable margin.",
  lower_than_expected:
    "Your payslip shows less take-home than expected — could be a tax code issue, student loan repayment, or another deduction not modelled here.",
  higher_than_expected:
    "Your payslip shows more take-home than expected — could be a more generous tax code, a bonus, or backpay not reflected in a simple annual estimate.",
};

export function PayslipComparisonForm({
  pensionContributionPercent,
  currency,
}: {
  pensionContributionPercent: number;
  currency: CurrencyCode;
}) {
  const [period, setPeriod] = useState<PayslipPeriod>("monthly");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [result, setResult] = useState<PayslipComparisonResult | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const periodGross = Number(gross);
    const periodNet = Number(net);
    if (!Number.isFinite(periodGross) || periodGross <= 0 || !Number.isFinite(periodNet) || periodNet <= 0) return;

    setResult(comparePayslip({ period, periodGross, periodNet, pensionContributionPercent }));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 font-display text-lg text-foreground">Payslip comparison</h2>
      <p className="mb-4 text-sm text-foreground-muted">
        Paste in a real payslip&apos;s gross and net for one period — a comparison tool, not a source of truth. A
        mismatch doesn&apos;t mean this calculator is wrong, just that something else may be affecting your real
        payslip.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="inline-flex self-start rounded-full border border-border p-1">
          {(["weekly", "monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
                period === option ? "bg-accent text-accent-foreground" : "text-foreground-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="payslip-gross" className="mb-1.5 block text-sm text-foreground-muted">
              Gross for this period
            </label>
            <input
              id="payslip-gross"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={gross}
              onChange={(event) => setGross(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="payslip-net" className="mb-1.5 block text-sm text-foreground-muted">
              Net (take-home) for this period
            </label>
            <input
              id="payslip-net"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={net}
              onChange={(event) => setNet(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>

        <SubmitButton>Compare</SubmitButton>
      </form>

      {result ? (
        <div className="mt-4 rounded-lg border border-border p-3">
          <p className="font-numeric text-sm text-foreground">
            Expected: {formatCurrency(result.expectedNetForPeriod, currency)} · Your payslip:{" "}
            {formatCurrency(result.actualNetForPeriod, currency)}
          </p>
          <p className={`mt-2 text-sm ${result.status === "match" ? "text-positive" : "text-negative"}`}>
            {STATUS_MESSAGE[result.status]}
          </p>
        </div>
      ) : null}
    </div>
  );
}
