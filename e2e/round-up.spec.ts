import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("manual round-ups", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // A goal to round up toward.
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await page.getByLabel("Goal name").fill("Round-up target");
    await page.getByLabel("Target amount").fill("100");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    await page.goto("/spending");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("rounding up a coffee logs the spare change to the chosen goal", async ({ page }) => {
    await page.getByLabel("Label").fill("Coffee");
    await page.getByLabel("Amount", { exact: true }).fill("4.60");
    await page.getByRole("button", { name: "Log spending" }).click();

    await expect(page.getByText("Coffee")).toBeVisible();
    await page.getByRole("button", { name: "Round up +£0.40" }).click();

    await page.getByLabel("Round up to goal").selectOption({ label: "Round-up target" });
    const roundUpForm = page.locator("form").filter({ has: page.getByLabel("Round up to goal") });
    await roundUpForm.getByRole("button", { name: "Add" }).click();

    // Reflected on the dashboard as a contribution to the goal.
    await page.goto("/dashboard");
    const goalCard = page.getByText("Round-up target").locator("xpath=ancestor::li");
    await expect(goalCard.getByText("£0.40", { exact: true })).toBeVisible();
  });

  test("a whole-pound amount has no round-up offered", async ({ page }) => {
    await page.getByLabel("Label").fill("Round number purchase");
    await page.getByLabel("Amount", { exact: true }).fill("10");
    await page.getByRole("button", { name: "Log spending" }).click();

    await expect(page.getByText("Round number purchase")).toBeVisible();
    await expect(page.getByText(/Round up \+/)).not.toBeVisible();
  });
});
