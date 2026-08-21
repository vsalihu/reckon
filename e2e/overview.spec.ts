import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("overview dashboard", () => {
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

  test("pulls together income, goals, spending, and scenarios logged elsewhere", async ({ page }) => {
    // Log income on the dashboard.
    await page.getByTestId("toggle-target-form").click();
    await page.getByLabel("Annual gross income target").fill("30000");
    await page.getByRole("button", { name: "Set target" }).click();
    await page.getByLabel("Label").fill("Salary");
    await page.getByLabel("Amount", { exact: true }).fill("2500");
    await page.getByRole("button", { name: "Log pay entry" }).click();

    // Log spending.
    await page.goto("/spending");
    await page.getByLabel("Label").fill("Rent");
    await page.getByLabel("Amount", { exact: true }).fill("900");
    await page.getByRole("button", { name: "Log spending" }).click();

    // Overview should reflect both without any further input.
    await page.goto("/overview");
    await expect(page.getByText("Income vs target")).toBeVisible();
    await expect(page.getByText("£2,500").first()).toBeVisible();
    await expect(page.getByText("Spending by category")).toBeVisible();
    await expect(page.getByText("Uncategorized")).toBeVisible();
    await expect(page.getByText("£900", { exact: true })).toBeVisible();
  });
});
