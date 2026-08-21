/**
 * Stamp Duty Land Tax (SDLT) — England & Northern Ireland.
 *
 * Effective from 1 April 2025, when the temporary threshold increases
 * introduced in September 2022 expired and the pre-2022 structure
 * returned. Unlike Income Tax, SDLT isn't organised by tax year — these
 * rates apply to any transaction from the effective date forward, until
 * the next Budget/Finance Act changes them.
 *
 * Verified against gov.uk (Aug 2026), cross-checked against an
 * independent search summarising the same page:
 *   https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
 *
 * Update the moment a Budget announces a change — SDLT thresholds move
 * more often than Income Tax bands.
 */

export interface SdltBand {
  /** Upper bound of this band, or null for "and above". */
  upTo: number | null;
  rate: number;
}

export interface SdltRates {
  effectiveFrom: string; // ISO date
  standardBands: SdltBand[];
  /** Only applies if the price is <= firstTimeBuyerMaxPrice; above that, standardBands apply in full instead. */
  firstTimeBuyer: {
    maxPrice: number;
    bands: SdltBand[];
  };
  /** Added on top of the rate that would otherwise apply (standard or FTB — though FTB relief and this surcharge are mutually exclusive in practice). */
  additionalPropertySurchargeRate: number;
}

export const SDLT_RATES_2025: SdltRates = {
  effectiveFrom: "2025-04-01",
  standardBands: [
    { upTo: 125_000, rate: 0 },
    { upTo: 250_000, rate: 0.02 },
    { upTo: 925_000, rate: 0.05 },
    { upTo: 1_500_000, rate: 0.1 },
    { upTo: null, rate: 0.12 },
  ],
  firstTimeBuyer: {
    maxPrice: 500_000,
    bands: [
      { upTo: 300_000, rate: 0 },
      { upTo: null, rate: 0.05 }, // only ever applies up to maxPrice, since relief is void above it
    ],
  },
  additionalPropertySurchargeRate: 0.05,
};
