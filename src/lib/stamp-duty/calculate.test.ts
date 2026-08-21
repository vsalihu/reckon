import { describe, expect, it } from "vitest";
import { calculateStampDuty } from "./calculate";

describe("calculateStampDuty — SDLT (England & Northern Ireland)", () => {
  it("standard rates for a £300,000 purchase", () => {
    // 0% to 125k, 2% (125k-250k]=2,500, 5% (250k-300k]=2,500 -> £5,000
    const result = calculateStampDuty({ nation: "england-ni", price: 300_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(result.amountDue).toBeCloseTo(5_000, 2);
  });

  it("first-time buyer relief: £0 due at £300,000", () => {
    const result = calculateStampDuty({ nation: "england-ni", price: 300_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    expect(result.amountDue).toBe(0);
  });

  it("first-time buyer relief applies partially between £300k and £500k", () => {
    // 0% to 300k, 5% (300k-400k]=5,000
    const result = calculateStampDuty({ nation: "england-ni", price: 400_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    expect(result.amountDue).toBeCloseTo(5_000, 2);
  });

  it("first-time buyer relief does NOT apply above £500,000 — standard rates used instead", () => {
    const ftbAbove500k = calculateStampDuty({ nation: "england-ni", price: 600_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    const standard600k = calculateStampDuty({ nation: "england-ni", price: 600_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(ftbAbove500k.amountDue).toBeCloseTo(standard600k.amountDue, 2);
  });

  it("additional-property surcharge adds 5% of the full price on top of standard bands", () => {
    // standard £5,000 (as above) + 5% * 300,000 = £15,000 surcharge -> £20,000
    const result = calculateStampDuty({ nation: "england-ni", price: 300_000, isFirstTimeBuyer: false, isAdditionalProperty: true });
    expect(result.amountDue).toBeCloseTo(20_000, 2);
  });

  it("additional-property takes precedence over first-time-buyer if both are somehow set", () => {
    const result = calculateStampDuty({ nation: "england-ni", price: 300_000, isFirstTimeBuyer: true, isAdditionalProperty: true });
    expect(result.amountDue).toBeCloseTo(20_000, 2); // surcharge path, not FTB relief
  });
});

describe("calculateStampDuty — LBTT (Scotland)", () => {
  it("standard rates for a £280,000 purchase", () => {
    // 2% (145k-250k]=2,100, 5% (250k-280k]=1,500 -> £3,600
    const result = calculateStampDuty({ nation: "scotland", price: 280_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(result.amountDue).toBeCloseTo(3_600, 2);
  });

  it("first-time buyer relief raises the nil band to £175,000", () => {
    const result = calculateStampDuty({ nation: "scotland", price: 160_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    expect(result.amountDue).toBe(0);
  });

  it("first-time buyer relief saves up to £600 at the top of the widened band", () => {
    const withRelief = calculateStampDuty({ nation: "scotland", price: 175_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    const withoutRelief = calculateStampDuty({ nation: "scotland", price: 175_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(withoutRelief.amountDue - withRelief.amountDue).toBeCloseTo(600, 2);
  });

  it("Additional Dwelling Supplement is 8% of the FULL price, from £0, on top of standard bands", () => {
    // standard: 2% (145k-200k]=1,100 + ADS 8%*200,000=16,000 -> £17,100
    const result = calculateStampDuty({ nation: "scotland", price: 200_000, isFirstTimeBuyer: false, isAdditionalProperty: true });
    expect(result.amountDue).toBeCloseTo(17_100, 2);
  });
});

describe("calculateStampDuty — LTT (Wales)", () => {
  it("standard rates for a £300,000 purchase", () => {
    // 6% (225k-300k]=4,500
    const result = calculateStampDuty({ nation: "wales", price: 300_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(result.amountDue).toBeCloseTo(4_500, 2);
  });

  it("has NO first-time buyer relief — identical amount regardless of the flag", () => {
    const ftb = calculateStampDuty({ nation: "wales", price: 300_000, isFirstTimeBuyer: true, isAdditionalProperty: false });
    const notFtb = calculateStampDuty({ nation: "wales", price: 300_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    expect(ftb.amountDue).toBe(notFtb.amountDue);
  });

  it("higher rates for an additional property use a wholly separate band table, verified against gov.wales's own worked example", () => {
    // gov.wales's own example: a £260,000 second home = £15,950
    const result = calculateStampDuty({ nation: "wales", price: 260_000, isFirstTimeBuyer: false, isAdditionalProperty: true });
    expect(result.amountDue).toBeCloseTo(15_950, 2);
  });

  it("the higher-rate result is NOT simply standard-rate-plus-a-flat-percentage", () => {
    const standard = calculateStampDuty({ nation: "wales", price: 260_000, isFirstTimeBuyer: false, isAdditionalProperty: false });
    const higher = calculateStampDuty({ nation: "wales", price: 260_000, isFirstTimeBuyer: false, isAdditionalProperty: true });
    // If it were "standard + flat 5%", higher would be standard + 13,000 = 4,600. It is not.
    expect(higher.amountDue).not.toBeCloseTo(standard.amountDue + 260_000 * 0.05, 2);
  });
});

describe("calculateStampDuty — shared behaviour", () => {
  it("is £0 for a £0 price in every nation", () => {
    for (const nation of ["england-ni", "scotland", "wales"] as const) {
      const result = calculateStampDuty({ nation, price: 0, isFirstTimeBuyer: false, isAdditionalProperty: false });
      expect(result.amountDue).toBe(0);
    }
  });

  it("rejects a negative price", () => {
    expect(() => calculateStampDuty({ nation: "england-ni", price: -1, isFirstTimeBuyer: false, isAdditionalProperty: false })).toThrow(
      RangeError,
    );
  });
});
