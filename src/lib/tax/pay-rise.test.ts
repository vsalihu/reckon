import { describe, expect, it } from "vitest";
import { calculatePayRiseImpact } from "./pay-rise";

describe("calculatePayRiseImpact", () => {
  it("shows a net increase smaller than the raw gross increase (tax/NI take a share)", () => {
    const result = calculatePayRiseImpact({ currentPayeGross: 35_000, newPayeGross: 40_000 });
    expect(result.grossIncreaseAnnual).toBe(5_000);
    expect(result.netIncreaseAnnual).toBeGreaterThan(0);
    expect(result.netIncreaseAnnual).toBeLessThan(result.grossIncreaseAnnual);
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(1);
  });

  it("shows a lower effective rate when the raise pushes income into a higher tax band", () => {
    // Raise entirely within the basic band vs a raise that crosses into higher-rate.
    const withinBasicBand = calculatePayRiseImpact({ currentPayeGross: 20_000, newPayeGross: 25_000 });
    const crossingIntoHigherBand = calculatePayRiseImpact({ currentPayeGross: 48_000, newPayeGross: 53_000 });

    expect(crossingIntoHigherBand.effectiveRate).toBeLessThan(withinBasicBand.effectiveRate);
  });

  it("is 0 for no change", () => {
    const result = calculatePayRiseImpact({ currentPayeGross: 30_000, newPayeGross: 30_000 });
    expect(result.grossIncreaseAnnual).toBe(0);
    expect(result.netIncreaseAnnual).toBe(0);
  });

  it("holds self-employed profit and pension constant, isolating the PAYE change", () => {
    const result = calculatePayRiseImpact({
      currentPayeGross: 30_000,
      newPayeGross: 35_000,
      selfEmployedProfit: 10_000,
      pensionContributionPercent: 5,
    });
    // The gross increase should reflect only the PAYE change, not the self-employed portion.
    expect(result.grossIncreaseAnnual).toBe(5_000);
  });

  it("reports monthly as annual/12", () => {
    const result = calculatePayRiseImpact({ currentPayeGross: 30_000, newPayeGross: 36_000 });
    expect(result.netIncreaseMonthly).toBeCloseTo(result.netIncreaseAnnual / 12, 6);
  });
});
