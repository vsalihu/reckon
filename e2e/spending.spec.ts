import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("spending tracking", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/spending");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("creating a custom category and logging spending against it", async ({ page }) => {
    await page.getByLabel("New category").fill("Groceries");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("button", { name: "Delete category Groceries" })).toBeVisible();

    await page.getByLabel("Label").fill("Weekly shop");
    await page.getByLabel("Amount", { exact: true }).fill("65.50");
    await page.getByLabel("Category", { exact: true }).selectOption({ label: "Groceries" });
    await page.getByRole("button", { name: "Log spending" }).click();

    await expect(page.getByText("Weekly shop")).toBeVisible();
    await expect(page.getByText("£65.50", { exact: true })).toBeVisible();
  });

  test("deleting an entry removes it from the list", async ({ page }) => {
    await page.getByLabel("Label").fill("One-off purchase");
    await page.getByLabel("Amount", { exact: true }).fill("20");
    await page.getByRole("button", { name: "Log spending" }).click();

    await expect(page.getByText("One-off purchase")).toBeVisible();
    await page.getByRole("button", { name: "Delete One-off purchase" }).click();
    await expect(page.getByText("One-off purchase")).not.toBeVisible();
  });
});
