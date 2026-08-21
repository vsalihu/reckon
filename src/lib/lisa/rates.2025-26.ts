/**
 * Lifetime ISA (LISA) rules.
 *
 * Verified against gov.uk (Aug 2026), cross-checked against independent
 * sources: https://www.gov.uk/lifetime-isa and
 * https://www.gov.uk/lifetime-isa/how-it-works
 *
 * Note: the Autumn Budget 2025 confirmed the government will consult in
 * early 2026 on replacing the LISA with a new first-time-buyer savings
 * product, expected to launch from April 2028. These figures reflect the
 * scheme as it stands today — revisit if/when that consultation concludes.
 */
export interface LisaRules {
  effectiveFrom: string;
  /** Annual contribution limit this bonus applies to (also counts toward the wider £20,000 ISA allowance). */
  annualContributionLimit: number;
  bonusRate: number;
  /** annualContributionLimit × bonusRate, stated explicitly since it's the number people actually look for. */
  annualBonusCap: number;
  /** Above this price, LISA funds can't be used toward the purchase penalty-free — frozen since the scheme launched in April 2017. */
  propertyPriceLimit: number;
  /** The account must have been open this long before a penalty-free first-home withdrawal. */
  minimumAccountAgeMonths: number;
}

export const LISA_RULES_2025_26: LisaRules = {
  effectiveFrom: "2017-04-06",
  annualContributionLimit: 4_000,
  bonusRate: 0.25,
  annualBonusCap: 1_000,
  propertyPriceLimit: 450_000,
  minimumAccountAgeMonths: 12,
};
