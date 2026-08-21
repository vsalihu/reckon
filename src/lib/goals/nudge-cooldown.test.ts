import { describe, expect, it } from "vitest";
import { shouldSendEmailNudge } from "./nudge-cooldown";

describe("shouldSendEmailNudge", () => {
  const now = new Date("2025-07-08T12:00:00Z");

  it("sends when no nudge has ever been sent", () => {
    expect(shouldSendEmailNudge(null, now)).toBe(true);
  });

  it("does not send again within 7 days", () => {
    const lastNudge = new Date("2025-07-05T12:00:00Z"); // 3 days ago
    expect(shouldSendEmailNudge(lastNudge, now)).toBe(false);
  });

  it("sends again once 7 days have passed", () => {
    const lastNudge = new Date("2025-07-01T12:00:00Z"); // exactly 7 days ago
    expect(shouldSendEmailNudge(lastNudge, now)).toBe(true);
  });

  it("does not send at 6 days 23 hours", () => {
    const lastNudge = new Date("2025-07-01T13:00:00Z");
    expect(shouldSendEmailNudge(lastNudge, now)).toBe(false);
  });
});
