import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("recurring bills", () => {
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

  test("adding a bill shows it in the upcoming list and the monthly commitment total", async ({ page }) => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);

    await page.getByLabel("Bill name").fill("Netflix");
    await page.getByLabel("Bill amount").fill("15.99");
    await page.getByLabel("Frequency").selectOption("monthly");
    await page.getByLabel("Next due date").fill(soon.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Add bill" }).click();

    await expect(page.getByText("Netflix")).toBeVisible();
    await expect(page.getByText("£15.99/mo already committed")).toBeVisible();
  });

  test("marking a bill paid logs a spending entry and advances the due date", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);

    await page.getByLabel("Bill name").fill("Gym membership");
    await page.getByLabel("Bill amount").fill("30");
    await page.getByLabel("Frequency").selectOption("monthly");
    await page.getByLabel("Next due date").fill(today);
    await page.getByRole("button", { name: "Add bill" }).click();

    const billRow = page.getByText("Gym membership").locator("xpath=ancestor::li");
    await billRow.getByRole("button", { name: "Mark paid" }).click();

    // Shows up as an ordinary spending entry now.
    await expect(page.getByText("Gym membership")).toBeVisible();
    await expect(page.getByText("£30", { exact: true }).first()).toBeVisible();
  });

  test("deleting a bill removes it from the list", async ({ page }) => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);

    await page.getByLabel("Bill name").fill("Temporary sub");
    await page.getByLabel("Bill amount").fill("9.99");
    await page.getByLabel("Frequency").selectOption("monthly");
    await page.getByLabel("Next due date").fill(soon.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Add bill" }).click();

    await expect(page.getByText("Temporary sub")).toBeVisible();
    await page.getByRole("button", { name: "Delete Temporary sub" }).click();
    await expect(page.getByText("Temporary sub")).not.toBeVisible();
  });
});
