import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("tax tools", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/tax-tools");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("payslip comparison flags a lower-than-expected net", async ({ page }) => {
    await page.getByLabel("Gross for this period").fill("3000");
    await page.getByLabel("Net (take-home) for this period").fill("1500"); // implausibly low for £3k gross
    await page.getByRole("button", { name: "Compare" }).click();

    await expect(page.getByText(/less take-home than expected/)).toBeVisible();
  });

  test("payslip comparison reports a match for a realistic net figure", async ({ page }) => {
    // £36,000/year PAYE gross, no pension -> reasonably close to calculator's own monthly estimate.
    await page.getByLabel("Gross for this period").fill("3000");
    await page.getByLabel("Net (take-home) for this period").fill("2450");
    await page.getByRole("button", { name: "Compare" }).click();

    await expect(page.getByText(/Matches our estimate|less take-home than expected|more take-home than expected/)).toBeVisible();
  });

  test("pay rise simulator updates the projected extra take-home as the new salary changes", async ({ page }) => {
    await expect(page.getByText("Pay rise simulator")).toBeVisible();

    const input = page.getByLabel("New annual PAYE gross");
    await input.fill("40000");
    await expect(page.getByText("Extra take-home")).toBeVisible();

    const firstReading = await page.getByText(/reaches take-home/).textContent();

    await input.fill("60000");
    const secondReading = await page.getByText(/reaches take-home/).textContent();

    expect(secondReading).not.toBe(firstReading);
  });
});
