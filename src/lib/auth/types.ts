export interface AuthActionState {
  error?: string;
}

/** Cookie used to carry the chosen currency through the Google OAuth / email-confirmation redirect. */
export const PENDING_CURRENCY_COOKIE = "reckon_pending_currency";
