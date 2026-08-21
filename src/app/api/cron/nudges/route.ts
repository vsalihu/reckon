import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { evaluateGoals } from "@/lib/goals/evaluate-goals";
import { shouldSendEmailNudge } from "@/lib/goals/nudge-cooldown";
import { getEmailSender } from "@/lib/notifications";
import { CURRENT_UK_TAX_YEAR } from "@/lib/tax";

/**
 * Evaluates every user's goals and sends email nudges for the ones that
 * are behind pace, respecting the 7-day cooldown (see nudge-cooldown.ts).
 * The in-app banner has no cooldown — it's computed live on each dashboard
 * load in src/app/dashboard/page.tsx via the same evaluateGoals() call.
 *
 * Intended to run on a schedule (e.g. Vercel Cron, daily) hitting this
 * route with `Authorization: Bearer $CRON_SECRET`. Uses the service-role
 * client deliberately — this has to read/write across every user's data,
 * which RLS exists specifically to prevent for normal request paths.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const emailSender = getEmailSender();
  const now = new Date();

  const [{ data: profiles }, { data: targets }, { data: goals }, { data: contributions }, { data: incomeEntries }, { data: recentNudges }] =
    await Promise.all([
      supabase.from("profiles").select("id"),
      supabase.from("income_targets").select("user_id, annual_gross_amount").eq("tax_year", CURRENT_UK_TAX_YEAR.taxYear),
      supabase.from("goals").select("id, owner_id, name, target_amount, deadline, created_at"),
      supabase.from("goal_contributions").select("goal_id, user_id, amount, contributed_at"),
      supabase.from("income_entries").select("user_id, amount, entry_date"),
      supabase
        .from("goal_nudges")
        .select("goal_id, sent_at")
        .eq("channel", "email")
        .order("sent_at", { ascending: false }),
    ]);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailByUserId = new Map(authUsers?.users.map((u) => [u.id, u.email]) ?? []);

  const targetByUserId = new Map((targets ?? []).map((t) => [t.user_id, Number(t.annual_gross_amount)]));
  const lastEmailNudgeByGoalId = new Map<string, Date>();
  for (const nudge of recentNudges ?? []) {
    if (!lastEmailNudgeByGoalId.has(nudge.goal_id)) {
      lastEmailNudgeByGoalId.set(nudge.goal_id, new Date(nudge.sent_at));
    }
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles ?? []) {
    const userGoals = (goals ?? []).filter((g) => g.owner_id === profile.id);
    if (userGoals.length === 0) continue;

    const userContributions = (contributions ?? []).filter((c) => c.user_id === profile.id);
    const userIncomeEntries = (incomeEntries ?? []).filter((e) => e.user_id === profile.id);
    const annualGrossTarget = targetByUserId.get(profile.id) ?? 0;

    const statuses = evaluateGoals({
      goals: userGoals.map((g) => ({
        id: g.id,
        target_amount: Number(g.target_amount),
        deadline: g.deadline,
        created_at: g.created_at,
      })),
      contributions: userContributions.map((c) => ({
        goal_id: c.goal_id,
        amount: Number(c.amount),
        contributed_at: c.contributed_at,
      })),
      incomeEntries: userIncomeEntries.map((e) => ({ amount: Number(e.amount), entry_date: e.entry_date })),
      annualGrossTarget,
      now,
    });

    for (const status of statuses) {
      if (status.result.status !== "behind") continue;

      const lastNudge = lastEmailNudgeByGoalId.get(status.goalId) ?? null;
      if (!shouldSendEmailNudge(lastNudge, now)) {
        skipped++;
        continue;
      }

      const goal = userGoals.find((g) => g.id === status.goalId)!;
      const email = emailByUserId.get(profile.id);
      if (!email) continue;

      await emailSender.send({
        to: email,
        subject: `You're falling behind on "${goal.name}"`,
        body: `Your contributions to "${goal.name}" aren't keeping pace with your income right now. Log in to Reckon to top it up: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://reckon.app"}/dashboard`,
      });

      await supabase.from("goal_nudges").insert({
        user_id: profile.id,
        goal_id: status.goalId,
        channel: "email",
        sent_at: now.toISOString(),
      });

      sent++;
    }
  }

  return NextResponse.json({ sent, skipped });
}
