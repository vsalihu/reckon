/**
 * UK self-employed National Insurance (Class 2 and Class 4) rates and
 * thresholds.
 *
 * Tax year: 2025/26 (6 April 2025 – 5 April 2026).
 *
 * IMPORTANT — Class 2 changed significantly from April 2024: it is no
 * longer a mandatory charge for most self-employed people. Profits at or
 * above `smallProfitsThreshold` get a National Insurance credit
 * automatically, at £0 cost. Only profits BELOW that threshold have the
 * option to pay Class 2 voluntarily, at `class2WeeklyRate` per week, to
 * protect State Pension entitlement — this calculator does not model
 * that voluntary election; it only reports mandatory liability (£0
 * either way) and flags the option. See docs/mixed-income-tax.md.
 *
 * Verified against gov.uk (Aug 2026) — cross-checked two independent
 * searches, both agreeing on these figures for 2025/26:
 *   - Class 2 rate: £3.50/week; Small Profits Threshold: £6,845
 *   - Class 4: 6% between the Lower and Upper Profits Limits, 2% above
 *
 * Update alongside rates.uk.<year>.ts each April — see that file's header
 * for the general update process. Source: https://www.gov.uk/self-employed-national-insurance-rates
 * (fetch the correct tax year's historic page, not the current-year default).
 */

export interface UkSelfEmployedNiRates {
  taxYear: string;
  class2: {
    weeklyRate: number;
    /** At/above this annual profit, Class 2 is treated as paid for £0 — see file header. */
    smallProfitsThreshold: number;
  };
  class4: {
    lowerProfitsLimit: number;
    upperProfitsLimit: number;
    mainRate: number;
    upperRate: number;
  };
}

export const UK_SELF_EMPLOYED_NI_RATES_2025_26: UkSelfEmployedNiRates = {
  taxYear: "2025/26",
  class2: {
    weeklyRate: 3.5,
    smallProfitsThreshold: 6_845,
  },
  class4: {
    lowerProfitsLimit: 12_570,
    upperProfitsLimit: 50_270,
    mainRate: 0.06,
    upperRate: 0.02,
  },
};
