import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("milestone celebrations", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("crossing 25% for the first time shows a one-time toast", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.getByLabel("Goal name").fill("Milestone goal");
    await page.getByLabel("Target amount").fill("100");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    const goalCard = page.getByText("Milestone goal").locator("xpath=ancestor::li");
    await goalCard.getByRole("button", { name: "+£25" }).click();

    await expect(page.getByText("25% funded")).toBeVisible();

    // Reloading must not re-trigger the same toast — it's persisted server-side.
    await page.reload();
    await expect(page.getByText("25% funded")).not.toBeVisible();
  });

  test("fully funding a goal shows the 100% celebration", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.getByLabel("Goal name").fill("Fully funded goal");
    await page.getByLabel("Target amount").fill("25");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    const goalCard = page.getByText("Fully funded goal").locator("xpath=ancestor::li");
    await goalCard.getByRole("button", { name: "+£25" }).click();

    await expect(page.getByText("Goal funded! 🎉")).toBeVisible();
  });
});
