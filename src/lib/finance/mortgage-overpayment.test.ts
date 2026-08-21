import { describe, expect, it } from "vitest";
import { calculateMortgageOverpaymentImpact } from "./mortgage-overpayment";

describe("calculateMortgageOverpaymentImpact", () => {
  it("the standard schedule pays off in exactly the loan term with 0 overpayment", () => {
    const result = calculateMortgageOverpaymentImpact({ loanAmount: 200_000, annualRatePercent: 4, termMonths: 300 });
    expect(result.standard.monthsToPayoff).toBe(300);
    expect(result.standard.totalInterestPaid).toBeGreaterThan(0);
  });

  it("a monthly overpayment reduces both the term and total interest paid", () => {
    const result = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      overpaymentMonthly: 200,
    });

    expect(result.withOverpayment.monthsToPayoff).toBeLessThan(result.standard.monthsToPayoff);
    expect(result.withOverpayment.totalInterestPaid).toBeLessThan(result.standard.totalInterestPaid);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("a one-off lump sum also reduces term and interest", () => {
    const result = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      lumpSum: 20_000,
      lumpSumMonth: 12,
    });

    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("a lump sum paid earlier saves more interest than the same lump sum paid later", () => {
    const early = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      lumpSum: 20_000,
      lumpSumMonth: 12,
    });
    const late = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      lumpSum: 20_000,
      lumpSumMonth: 200,
    });

    expect(early.interestSaved).toBeGreaterThan(late.interestSaved);
  });

  it("at 0% APR, overpayment shortens the term with zero interest saved (there was never any interest)", () => {
    const result = calculateMortgageOverpaymentImpact({
      loanAmount: 12_000,
      annualRatePercent: 0,
      termMonths: 12,
      overpaymentMonthly: 500,
    });

    expect(result.standard.totalInterestPaid).toBe(0);
    expect(result.withOverpayment.totalInterestPaid).toBe(0);
    expect(result.interestSaved).toBe(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it("combining a monthly overpayment and a lump sum compounds the savings", () => {
    const monthlyOnly = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      overpaymentMonthly: 100,
    });
    const combined = calculateMortgageOverpaymentImpact({
      loanAmount: 200_000,
      annualRatePercent: 4,
      termMonths: 300,
      overpaymentMonthly: 100,
      lumpSum: 10_000,
      lumpSumMonth: 6,
    });

    expect(combined.interestSaved).toBeGreaterThan(monthlyOnly.interestSaved);
    expect(combined.monthsSaved).toBeGreaterThan(monthlyOnly.monthsSaved);
  });

  it("rejects a lump sum without a month", () => {
    expect(() =>
      calculateMortgageOverpaymentImpact({ loanAmount: 200_000, annualRatePercent: 4, termMonths: 300, lumpSum: 5_000 }),
    ).toThrow(RangeError);
  });

  it("rejects invalid loan parameters", () => {
    expect(() => calculateMortgageOverpaymentImpact({ loanAmount: -1, annualRatePercent: 4, termMonths: 300 })).toThrow(
      RangeError,
    );
    expect(() => calculateMortgageOverpaymentImpact({ loanAmount: 200_000, annualRatePercent: 4, termMonths: 0 })).toThrow(
      RangeError,
    );
  });
});
