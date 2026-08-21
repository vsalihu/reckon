import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("mixed PAYE + self-employed tax and pension", () => {
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

  test("logging PAYE and self-employed entries shows a combined take-home breakdown", async ({ page }) => {
    // No entries yet -> prompts to log one, no breakdown.
    await expect(page.getByText("Log a pay entry to see your take-home estimate")).toBeVisible();

    // PAYE entry (default employment type).
    await page.getByLabel("Label").fill("Salary");
    await page.getByLabel("Amount", { exact: true }).fill("2500");
    await page.getByRole("button", { name: "Log pay entry" }).click();

    await expect(page.getByText("Gross (PAYE)")).toBeVisible();
    await expect(page.getByText("£2,500", { exact: true }).first()).toBeVisible();

    // Self-employed entry.
    await page.getByLabel("Label").fill("Freelance project");
    await page.getByLabel("Amount", { exact: true }).fill("1000");
    await page.getByLabel("Employment type").selectOption({ label: "Self-employed" });
    await page.getByRole("button", { name: "Log pay entry" }).click();

    await expect(page.getByText("Freelance project")).toBeVisible();
    await expect(page.getByText(/Self-employed · /)).toBeVisible();
    await expect(page.getByText("Gross (self-employed)")).toBeVisible();
    await expect(page.getByText("National Insurance (Class 1 + 4)")).toBeVisible();
  });

  test("setting a pension contribution adds a labelled deduction and reduces net pay", async ({ page }) => {
    await page.getByLabel("Label").fill("Salary");
    await page.getByLabel("Amount", { exact: true }).fill("3000");
    await page.getByRole("button", { name: "Log pay entry" }).click();

    await expect(page.getByText("Gross (PAYE)")).toBeVisible();
    const netBefore = await page.locator("text=Net (take-home)").locator("xpath=..").textContent();

    await page.getByTestId("toggle-pension-form").click();
    await page.getByLabel("Pension contribution (% of PAYE gross)").fill("5");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Pension contribution", { exact: true })).toBeVisible();
    const netAfter = await page.locator("text=Net (take-home)").locator("xpath=..").textContent();
    expect(netAfter).not.toBe(netBefore);
  });
});
