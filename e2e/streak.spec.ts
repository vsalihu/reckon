import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("goal streaks", () => {
  let userId: string;
  let email: string;

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("a goal with 3 consecutive on-pace weeks shows a 3-week streak", async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));
    const admin = adminClient();

    // Backdated goal: created 3 full weeks ago, £300 target, 10-week deadline
    // -> £30/week required if paced evenly (mirrors the unit test fixture).
    const createdAt = new Date(Date.now() - 3 * WEEK_MS);
    const deadline = new Date(createdAt.getTime() + 10 * WEEK_MS);

    const { data: goal } = await admin
      .from("goals")
      .insert({
        owner_id: userId,
        name: "Streaky goal",
        target_amount: 300,
        deadline: deadline.toISOString().slice(0, 10),
        priority: 0,
        created_at: createdAt.toISOString(),
      })
      .select()
      .single();

    // A generously-on-pace contribution (£50, vs the ~£30/week baseline) in
    // each of the 3 completed weeks — comfortably clears the required pace
    // even with the sub-day rounding `deadline` (a DATE column, so it loses
    // the time-of-day that `created_at` — a TIMESTAMPTZ — keeps) introduces
    // versus the precise week-boundary math the unit tests use directly.
    for (let week = 0; week < 3; week++) {
      const contributedAt = new Date(createdAt.getTime() + week * WEEK_MS + 24 * 60 * 60 * 1000);
      await admin.from("goal_contributions").insert({
        user_id: userId,
        goal_id: goal.id,
        goal_name_snapshot: goal.name,
        amount: 50,
        contributed_at: contributedAt.toISOString().slice(0, 10),
      });
    }

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByText("🔥 3wk streak")).toBeVisible();
  });

  test("a brand new goal shows no streak yet", async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await page.getByLabel("Goal name").fill("Brand new goal");
    await page.getByLabel("Target amount").fill("500");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    await expect(page.getByText("Brand new goal")).toBeVisible();
    await expect(page.getByText(/wk streak/)).not.toBeVisible();
  });
});
