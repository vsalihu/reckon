import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("50/30/20 budget check", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Income so after-tax income is non-zero.
    await page.getByLabel("Label").fill("Salary");
    await page.getByLabel("Amount", { exact: true }).fill("2000");
    await page.getByRole("button", { name: "Log pay entry" }).click();

    await page.goto("/spending");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("tagging a category as needs and logging spending updates the needs bucket", async ({ page }) => {
    await expect(page.getByText("Log some income to see this check.")).not.toBeVisible();

    await page.getByLabel("New category").fill("Rent");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByLabel("Budget group for Rent")).toBeVisible();
    await page.getByLabel("Budget group for Rent").selectOption("needs");

    await page.getByLabel("Label").fill("October rent");
    await page.getByLabel("Amount", { exact: true }).fill("500");
    await page.getByLabel("Category", { exact: true }).selectOption({ label: "Rent" });
    await page.getByRole("button", { name: "Log spending" }).click();

    // 500 / 2000 after-tax = 25%, shown against the Needs row.
    await expect(page.getByTestId("budget-bucket-needs").getByText("25%")).toBeVisible();
  });

  test("untagged spending is excluded from the buckets and shown as unaccounted for", async ({ page }) => {
    await page.getByLabel("Label").fill("Random purchase");
    await page.getByLabel("Amount", { exact: true }).fill("100");
    await page.getByRole("button", { name: "Log spending" }).click();

    await expect(page.getByText(/not yet accounted for/)).toBeVisible();
  });
});
