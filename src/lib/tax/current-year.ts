import { UK_TAX_RATES_2025_26 } from "./rates.uk.2025-26";

/**
 * Single source of truth for "which tax year rates does the app use right
 * now". Repoint this at a new `rates.uk.<YYYY>-<YY>.ts` file each April.
 */
export const CURRENT_UK_TAX_YEAR = UK_TAX_RATES_2025_26;
