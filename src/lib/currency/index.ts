/**
 * Supported currencies. A user picks exactly one at signup and it's fixed
 * for the account (no mixed-currency support, per the brief). Adding a
 * currency later is just adding an entry here plus an Intl-supported code.
 */
export interface CurrencyDefinition {
  code: "GBP" | "USD";
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyDefinition[] = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
];

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
