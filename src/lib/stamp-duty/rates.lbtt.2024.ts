/**
 * Land and Buildings Transaction Tax (LBTT) — Scotland.
 *
 * Standard bands effective since 1 April 2021 (unchanged since); the
 * Additional Dwelling Supplement (ADS) rate below is effective from
 * 5 December 2024. Confirmed unchanged for the 2026/27 Scottish Budget.
 * Not tax-year-bound — applies to any transaction from the effective
 * date forward.
 *
 * Verified against Revenue Scotland (Aug 2026), cross-checked against an
 * independent search:
 *   https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property
 *   https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads
 *
 * A different tax system from SDLT — do not extrapolate England/NI
 * figures here or vice versa.
 */

export interface LbttBand {
  upTo: number | null;
  rate: number;
}

export interface LbttRates {
  effectiveFrom: string;
  standardBands: LbttBand[];
  /** First-time buyer relief raises the nil-rate band ceiling to this amount (no separate band structure otherwise — standard rates apply above it). */
  firstTimeBuyerNilBand: number;
  /**
   * Additional Dwelling Supplement: a flat rate on the FULL purchase
   * price (from £0, no nil band of its own), on top of standard LBTT.
   */
  additionalDwellingSupplementRate: number;
}

export const LBTT_RATES_2024: LbttRates = {
  effectiveFrom: "2021-04-01",
  standardBands: [
    { upTo: 145_000, rate: 0 },
    { upTo: 250_000, rate: 0.02 },
    { upTo: 325_000, rate: 0.05 },
    { upTo: 750_000, rate: 0.1 },
    { upTo: null, rate: 0.12 },
  ],
  firstTimeBuyerNilBand: 175_000,
  additionalDwellingSupplementRate: 0.08, // effective 2024-12-05
};
