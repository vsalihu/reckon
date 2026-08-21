import { UK_TAX_RATES_2025_26 } from "./rates.uk.2025-26";
import { UK_SELF_EMPLOYED_NI_RATES_2025_26 } from "./rates.uk.self-employed.2025-26";

/**
 * Single source of truth for "which tax year rates does the app use right
 * now". Repoint these at new `rates.uk.<YYYY>-<YY>.ts` /
 * `rates.uk.self-employed.<YYYY>-<YY>.ts` files each April.
 */
export const CURRENT_UK_TAX_YEAR = UK_TAX_RATES_2025_26;
export const CURRENT_UK_SELF_EMPLOYED_NI = UK_SELF_EMPLOYED_NI_RATES_2025_26;
