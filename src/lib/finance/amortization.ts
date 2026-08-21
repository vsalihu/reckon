/**
 * Standard fixed-rate amortizing loan payment. See docs/car-house-costs.md.
 */
export function calculateLoanPayment(principal: number, annualRatePercent: number, termMonths: number): number {
  if (principal < 0) throw new RangeError("principal must be >= 0");
  if (termMonths <= 0) throw new RangeError("termMonths must be > 0");
  if (annualRatePercent < 0) throw new RangeError("annualRatePercent must be >= 0");

  if (principal === 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}
