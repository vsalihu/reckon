const EMAIL_NUDGE_COOLDOWN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A goal that's behind only gets a fresh email nudge once the previous one
 * (if any) is at least 7 days old — see docs/behind-on-goal.md. The in-app
 * banner has no cooldown; it's recomputed live every page load.
 */
export function shouldSendEmailNudge(lastEmailNudgeAt: Date | null, now: Date = new Date()): boolean {
  if (!lastEmailNudgeAt) return true;
  return now.getTime() - lastEmailNudgeAt.getTime() >= EMAIL_NUDGE_COOLDOWN_DAYS * DAY_MS;
}
