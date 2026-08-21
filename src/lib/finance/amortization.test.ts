import { describe, expect, it } from "vitest";
import { calculateLoanPayment } from "./amortization";

describe("calculateLoanPayment", () => {
  it("matches a known amortization result (£20,000 @ 6% APR over 48 months)", () => {
    // Verified against standard amortization formula: ≈ £469.70/month
    const payment = calculateLoanPayment(20_000, 6, 48);
    expect(payment).toBeCloseTo(469.7, 0);
  });

  it("splits evenly with no interest at 0% APR", () => {
    const payment = calculateLoanPayment(12_000, 0, 12);
    expect(payment).toBeCloseTo(1_000, 6);
  });

  it("returns 0 for a 0 principal", () => {
    expect(calculateLoanPayment(0, 5, 36)).toBe(0);
  });

  it("produces a larger payment for a higher rate, same principal and term", () => {
    const low = calculateLoanPayment(10_000, 3, 36);
    const high = calculateLoanPayment(10_000, 15, 36);
    expect(high).toBeGreaterThan(low);
  });

  it("produces a smaller payment for a longer term, same principal and rate", () => {
    const short = calculateLoanPayment(10_000, 5, 24);
    const long = calculateLoanPayment(10_000, 5, 60);
    expect(long).toBeLessThan(short);
  });

  it("rejects a negative principal", () => {
    expect(() => calculateLoanPayment(-1, 5, 12)).toThrow(RangeError);
  });

  it("rejects a zero or negative term", () => {
    expect(() => calculateLoanPayment(1000, 5, 0)).toThrow(RangeError);
    expect(() => calculateLoanPayment(1000, 5, -12)).toThrow(RangeError);
  });

  it("rejects a negative rate", () => {
    expect(() => calculateLoanPayment(1000, -1, 12)).toThrow(RangeError);
  });
});
