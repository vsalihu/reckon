import type { EmailMessage, EmailSender } from "./types";

/** Dev/fallback sender — logs instead of sending. Used when no real provider is configured. */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:console] to=${message.to} subject="${message.subject}"\n${message.body}`);
  }
}
