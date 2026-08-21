export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Anything that can send an email nudge. Keep provider-specific code
 * behind this interface — swapping providers later (Resend, Postmark,
 * Supabase's own mailer) should mean writing one new file, not touching
 * the nudge logic that calls it.
 */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
