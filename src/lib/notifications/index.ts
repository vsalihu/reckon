import type { EmailSender } from "./types";
import { ConsoleEmailSender } from "./console-sender";
import { ResendEmailSender } from "./resend-sender";

export type { EmailMessage, EmailSender } from "./types";

/** Picks the configured provider. Falls back to logging locally if none is set up. */
export function getEmailSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (apiKey && fromAddress) {
    return new ResendEmailSender(apiKey, fromAddress);
  }

  return new ConsoleEmailSender();
}
