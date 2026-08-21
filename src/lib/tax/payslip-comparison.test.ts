import { describe, expect, it } from "vitest";
import { comparePayslip } from "./payslip-comparison";
import { calculateMixedIncomeTakeHome } from "./mixed-income";

describe("comparePayslip", () => {
  it("matches when the payslip net equals the calculator's estimate for that period", () => {
    const estimate = calculateMixedIncomeTakeHome({ payeGross: 36_000, selfEmployedProfit: 0 });
    const monthlyNet = estimate.netMonthly;

    const result = comparePayslip({ period: "monthly", periodGross: 3_000, periodNet: monthlyNet });
    expect(result.status).toBe("match");
  });

  it("flags lower-than-expected when the payslip shows noticeably less net pay", () => {
    const estimate = calculateMixedIncomeTakeHome({ payeGross: 36_000, selfEmployedProfit: 0 });
    const result = comparePayslip({ period: "monthly", periodGross: 3_000, periodNet: estimate.netMonthly - 100 });
    expect(result.status).toBe("lower_than_expected");
  });

  it("flags higher-than-expected when the payslip shows noticeably more net pay", () => {
    const estimate = calculateMixedIncomeTakeHome({ payeGross: 36_000, selfEmployedProfit: 0 });
    const result = comparePayslip({ period: "monthly", periodGross: 3_000, periodNet: estimate.netMonthly + 100 });
    expect(result.status).toBe("higher_than_expected");
  });

  it("tolerates small rounding differences as a match", () => {
    const estimate = calculateMixedIncomeTakeHome({ payeGross: 36_000, selfEmployedProfit: 0 });
    const result = comparePayslip({ period: "monthly", periodGross: 3_000, periodNet: estimate.netMonthly + 0.5 });
    expect(result.status).toBe("match");
  });

  it("annualizes a weekly payslip correctly", () => {
    const estimate = calculateMixedIncomeTakeHome({ payeGross: 26_000, selfEmployedProfit: 0 }); // 500/week gross
    const result = comparePayslip({ period: "weekly", periodGross: 500, periodNet: estimate.netAnnual / 52 });
    expect(result.status).toBe("match");
  });

  it("accounts for the user's pension contribution percentage when set", () => {
    const withoutPension = comparePayslip({ period: "monthly", periodGross: 3_000, periodNet: 2_500 });
    const withPension = comparePayslip({
      period: "monthly",
      periodGross: 3_000,
      periodNet: 2_500,
      pensionContributionPercent: 5,
    });
    // Same payslip net, but a pension deduction lowers the expected net,
    // so the same £2,500 reads as a smaller mismatch (or none) with pension factored in.
    expect(withPension.differenceForPeriod).toBeGreaterThan(withoutPension.differenceForPeriod);
  });
});
