import { SDLT_RATES_2025, type SdltBand } from "./rates.sdlt.2025";
import { LBTT_RATES_2024 } from "./rates.lbtt.2024";
import { LTT_RATES_2024 } from "./rates.ltt.2024";

export type StampDutyNation = "england-ni" | "scotland" | "wales";

export interface StampDutyInput {
  nation: StampDutyNation;
  price: number;
  isFirstTimeBuyer: boolean;
  /** A second home, buy-to-let, etc. Mutually exclusive with isFirstTimeBuyer in practice — see calculateStampDuty. */
  isAdditionalProperty: boolean;
}

export interface StampDutyBandBreakdown {
  upTo: number | null;
  rate: number;
  amount: number;
}

export interface StampDutyResult {
  nation: StampDutyNation;
  taxName: string;
  amountDue: number;
  effectiveRate: number;
  breakdown: StampDutyBandBreakdown[];
  /** Human-readable note on which relief/surcharge applied, if any. */
  note: string | null;
}

/** Progressive band tax on portions of price, the shape all three systems share (just different bands/rates). */
function calculateBandedTax(price: number, bands: SdltBand[]): { total: number; breakdown: StampDutyBandBreakdown[] } {
  let remaining = price;
  let lowerBound = 0;
  const breakdown: StampDutyBandBreakdown[] = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    const bandCeiling = band.upTo ?? Infinity;
    const bandSize = bandCeiling - lowerBound;
    const portionInBand = Math.min(remaining, bandSize);
    const amount = round2(portionInBand * band.rate);

    breakdown.push({ upTo: band.upTo, rate: band.rate, amount });
    remaining -= portionInBand;
    lowerBound = bandCeiling;
  }

  return { total: round2(breakdown.reduce((sum, b) => sum + b.amount, 0)), breakdown };
}

function calculateSdlt(price: number, isFirstTimeBuyer: boolean, isAdditionalProperty: boolean): StampDutyResult {
  const rates = SDLT_RATES_2025;

  if (isAdditionalProperty) {
    const { total, breakdown } = calculateBandedTax(price, rates.standardBands);
    const surcharge = round2(price * rates.additionalPropertySurchargeRate);
    const amountDue = round2(total + surcharge);
    return {
      nation: "england-ni",
      taxName: "Stamp Duty Land Tax (SDLT)",
      amountDue,
      effectiveRate: price > 0 ? amountDue / price : 0,
      breakdown,
      note: `Includes a ${(rates.additionalPropertySurchargeRate * 100).toFixed(0)}% additional-property surcharge (${formatGbp(surcharge)}) on top of standard rates.`,
    };
  }

  const useFtbRelief = isFirstTimeBuyer && price <= rates.firstTimeBuyer.maxPrice;
  const bands = useFtbRelief ? rates.firstTimeBuyer.bands : rates.standardBands;
  const { total, breakdown } = calculateBandedTax(price, bands);

  return {
    nation: "england-ni",
    taxName: "Stamp Duty Land Tax (SDLT)",
    amountDue: total,
    effectiveRate: price > 0 ? total / price : 0,
    breakdown,
    note: useFtbRelief
      ? "First-time buyer relief applied."
      : isFirstTimeBuyer
        ? `First-time buyer relief doesn't apply above ${formatGbp(rates.firstTimeBuyer.maxPrice)} — standard rates used.`
        : null,
  };
}

function calculateLbtt(price: number, isFirstTimeBuyer: boolean, isAdditionalProperty: boolean): StampDutyResult {
  const rates = LBTT_RATES_2024;

  if (isAdditionalProperty) {
    const { total, breakdown } = calculateBandedTax(price, rates.standardBands);
    const ads = round2(price * rates.additionalDwellingSupplementRate);
    const amountDue = round2(total + ads);
    return {
      nation: "scotland",
      taxName: "Land and Buildings Transaction Tax (LBTT)",
      amountDue,
      effectiveRate: price > 0 ? amountDue / price : 0,
      breakdown,
      note: `Includes the ${(rates.additionalDwellingSupplementRate * 100).toFixed(0)}% Additional Dwelling Supplement (${formatGbp(ads)}), charged on the full price from £0.`,
    };
  }

  const bands = isFirstTimeBuyer
    ? [{ upTo: rates.firstTimeBuyerNilBand, rate: 0 }, ...rates.standardBands.slice(1)]
    : rates.standardBands;
  const { total, breakdown } = calculateBandedTax(price, bands);

  return {
    nation: "scotland",
    taxName: "Land and Buildings Transaction Tax (LBTT)",
    amountDue: total,
    effectiveRate: price > 0 ? total / price : 0,
    breakdown,
    note: isFirstTimeBuyer ? `First-time buyer relief applied — nil-rate band raised to ${formatGbp(rates.firstTimeBuyerNilBand)}.` : null,
  };
}

function calculateLtt(price: number, isFirstTimeBuyer: boolean, isAdditionalProperty: boolean): StampDutyResult {
  const rates = LTT_RATES_2024;
  const bands = isAdditionalProperty ? rates.higherBands : rates.standardBands;
  const { total, breakdown } = calculateBandedTax(price, bands);

  return {
    nation: "wales",
    taxName: "Land Transaction Tax (LTT)",
    amountDue: total,
    effectiveRate: price > 0 ? total / price : 0,
    breakdown,
    note: isAdditionalProperty
      ? "Higher residential rates applied (separate band structure, not a flat surcharge)."
      : isFirstTimeBuyer
        ? "Wales offers no first-time buyer relief — standard rates applied regardless."
        : null,
  };
}

/**
 * Routes to the correct nation-specific calculator — see
 * docs/stamp-duty.md. `isFirstTimeBuyer` and `isAdditionalProperty` are
 * treated as mutually exclusive in practice (an additional-property
 * purchase implies you already own a home): if both are true,
 * `isAdditionalProperty` takes precedence, since owning another property
 * is the fact that actually governs the tax treatment.
 */
export function calculateStampDuty(input: StampDutyInput): StampDutyResult {
  const { nation, price, isFirstTimeBuyer, isAdditionalProperty } = input;
  if (price < 0) throw new RangeError("price must be >= 0");

  switch (nation) {
    case "england-ni":
      return calculateSdlt(price, isFirstTimeBuyer, isAdditionalProperty);
    case "scotland":
      return calculateLbtt(price, isFirstTimeBuyer, isAdditionalProperty);
    case "wales":
      return calculateLtt(price, isFirstTimeBuyer, isAdditionalProperty);
  }
}

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
