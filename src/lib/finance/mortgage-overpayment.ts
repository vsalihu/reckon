import { calculateLoanPayment } from "./amortization";

export interface MortgageOverpaymentInput {
  loanAmount: number;
  annualRatePercent: number;
  termMonths: number;
  /** Extra paid every month on top of the standard payment. */
  overpaymentMonthly?: number;
  /** A one-off extra payment. */
  lumpSum?: number;
  /** 1-indexed month the lump sum is paid (month 1 = first payment). Required if lumpSum > 0. */
  lumpSumMonth?: number;
}

export interface AmortizationOutcome {
  monthsToPayoff: number;
  totalInterestPaid: number;
}

export interface MortgageOverpaymentResult {
  standard: AmortizationOutcome;
  withOverpayment: AmortizationOutcome;
  interestSaved: number;
  monthsSaved: number;
}

/**
 * Simulates a fixed-rate amortization schedule month by month, applying
 * any monthly overpayment and/or one-off lump sum, and returns how many
 * months it actually took to clear the balance and how much interest was
 * paid in total. This is real schedule recalculation, not an
 * approximation — see docs/car-house-costs.md.
 */
function simulateSchedule(
  loanAmount: number,
  monthlyRate: number,
  standardPayment: number,
  termMonths: number,
  overpaymentMonthly: number,
  lumpSum: number,
  lumpSumMonth: number | null,
): AmortizationOutcome {
  let balance = loanAmount;
  let totalInterestPaid = 0;
  let month = 0;

  // Safety cap: a well-formed standard payment always covers at least the
  // first month's interest, so this only guards against a pathological
  // input (e.g. overpayment so large or rate so unusual it never
  // converges) rather than firing in normal use.
  const maxMonths = termMonths * 4 + 12;

  while (balance > 0.01 && month < maxMonths) {
    month++;
    const interest = balance * monthlyRate;
    totalInterestPaid += interest;

    let payment = standardPayment + overpaymentMonthly;
    if (lumpSumMonth !== null && month === lumpSumMonth) payment += lumpSum;

    const principalPortion = payment - interest;
    balance = balance - principalPortion;
  }

  return { monthsToPayoff: month, totalInterestPaid: round2(totalInterestPaid) };
}

export function calculateMortgageOverpaymentImpact(input: MortgageOverpaymentInput): MortgageOverpaymentResult {
  const { loanAmount, annualRatePercent, termMonths, overpaymentMonthly = 0, lumpSum = 0, lumpSumMonth = null } = input;

  if (loanAmount < 0) throw new RangeError("loanAmount must be >= 0");
  if (termMonths <= 0) throw new RangeError("termMonths must be > 0");
  if (lumpSum > 0 && (lumpSumMonth === null || lumpSumMonth < 1)) {
    throw new RangeError("lumpSumMonth must be >= 1 when lumpSum is provided");
  }

  const standardPayment = calculateLoanPayment(loanAmount, annualRatePercent, termMonths);
  const monthlyRate = annualRatePercent / 100 / 12;

  const standard = simulateSchedule(loanAmount, monthlyRate, standardPayment, termMonths, 0, 0, null);
  const withOverpayment = simulateSchedule(
    loanAmount,
    monthlyRate,
    standardPayment,
    termMonths,
    overpaymentMonthly,
    lumpSum,
    lumpSumMonth,
  );

  return {
    standard,
    withOverpayment,
    interestSaved: round2(standard.totalInterestPaid - withOverpayment.totalInterestPaid),
    monthsSaved: standard.monthsToPayoff - withOverpayment.monthsToPayoff,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
