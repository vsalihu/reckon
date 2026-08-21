import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("LISA bonus tracker", () => {
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

  test("a LISA-linked goal shows the bonus on its detail page and a badge on the dashboard", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.getByLabel("Goal name").fill("First home LISA");
    await page.getByLabel("Target amount").fill("20000");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByLabel("This is a Lifetime ISA (LISA)").check();
    await page.getByRole("button", { name: "Create goal" }).click();

    const card = page.getByText("First home LISA").locator("xpath=ancestor::li");
    await card.getByRole("button", { name: "+£100" }).click();

    // Dashboard badge shows the bonus inline.
    await expect(page.getByText(/LISA bonus/)).toBeVisible();

    // Detail page shows the full breakdown.
    await page.getByText("First home LISA").click();
    await expect(page).toHaveURL(/\/goals\//);
    await expect(page.getByText("LISA bonus")).toBeVisible();
    await expect(page.getByText("Contributed (all time)")).toBeVisible();
    await expect(page.getByText("Bonus earned")).toBeVisible();
    // £100 contributed -> £25 bonus (25%)
    await expect(page.getByText("£25", { exact: true })).toBeVisible();
  });

  test("a goal without the LISA checkbox shows no bonus card", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.getByLabel("Goal name").fill("Plain goal");
    await page.getByLabel("Target amount").fill("500");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    await page.getByText("Plain goal").click();
    await expect(page).toHaveURL(/\/goals\//);
    await expect(page.getByText("LISA bonus")).not.toBeVisible();
  });
});
