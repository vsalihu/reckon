import type { EmailMessage, EmailSender } from "./types";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends via Resend's HTTP API directly (no SDK dependency needed for one
 * endpoint). Requires RESEND_API_KEY and EMAIL_FROM_ADDRESS env vars.
 */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        text: message.body,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend send failed (${response.status}): ${body}`);
    }
  }
}
