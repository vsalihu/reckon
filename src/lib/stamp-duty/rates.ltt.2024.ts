/**
 * Land Transaction Tax (LTT) — Wales.
 *
 * Standard bands effective since 10 October 2022; higher residential
 * rates (additional properties) effective from 11 December 2024. Not
 * tax-year-bound — applies to any transaction from the effective date
 * forward.
 *
 * Verified against gov.wales (Aug 2026), cross-checked against an
 * independent search:
 *   https://gov.wales/land-transaction-tax-rates-and-bands
 *
 * Unlike SDLT/LBTT, Wales's "additional property" rate is NOT a flat
 * surcharge added to the standard bands — it's an entirely separate
 * band/rate table (`higherBands` below). Do not compute it as
 * standard-rate-plus-percentage; use `higherBands` directly.
 *
 * Wales offers NO first-time buyer relief — confirmed explicitly on the
 * gov.wales page. All buyers pay the same standard rates regardless of
 * first-time-buyer status; the £225,000 nil-rate band just happens to
 * mean many first-time buyers pay nothing anyway.
 */

export interface LttBand {
  upTo: number | null;
  rate: number;
}

export interface LttRates {
  effectiveFrom: string;
  standardBands: LttBand[];
  /** No first-time buyer relief exists in this system — always false, kept explicit rather than omitted so callers can't assume otherwise. */
  hasFirstTimeBuyerRelief: false;
  /** Separate band table for additional properties — NOT standard + a flat surcharge. */
  higherBands: LttBand[];
}

export const LTT_RATES_2024: LttRates = {
  effectiveFrom: "2022-10-10",
  standardBands: [
    { upTo: 225_000, rate: 0 },
    { upTo: 400_000, rate: 0.06 },
    { upTo: 750_000, rate: 0.075 },
    { upTo: 1_500_000, rate: 0.1 },
    { upTo: null, rate: 0.12 },
  ],
  hasFirstTimeBuyerRelief: false,
  higherBands: [
    { upTo: 180_000, rate: 0.05 },
    { upTo: 250_000, rate: 0.085 },
    { upTo: 400_000, rate: 0.1 },
    { upTo: 750_000, rate: 0.125 },
    { upTo: 1_500_000, rate: 0.15 },
    { upTo: null, rate: 0.17 },
  ],
};
