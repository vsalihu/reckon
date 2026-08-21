import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("income tracking", () => {
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

  test("setting a target and logging a pay entry updates the progress gauge and take-home estimate", async ({
    page,
  }) => {
    await page.getByTestId("toggle-target-form").click();
    await page.getByLabel("Annual gross income target").fill("40000");
    await page.getByRole("button", { name: "Set target" }).click();

    await expect(page.getByText(/of £40,000/)).toBeVisible(); // gauge target label
    // Take-home estimate should now show a non-zero net figure for a £40k salary.
    await expect(page.getByText("Net (take-home)")).toBeVisible();

    await page.getByLabel("Label").fill("October salary");
    await page.getByLabel("Amount", { exact: true }).fill("2500");
    await page.getByRole("button", { name: "Log pay entry" }).click();

    await expect(page.getByText("October salary")).toBeVisible();
    // The entry amount appears both in the entry list and the gauge's current-total span.
    await expect(page.getByText("£2,500").first()).toBeVisible();
  });
});
