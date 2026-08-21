import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("stamp duty calculator", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/calculators/house");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("England/NI standard rates for £300,000 shows £5,000", async ({ page }) => {
    await page.getByLabel("Purchase price").fill("300000");
    await expect(page.getByText("£5,000")).toBeVisible();
  });

  test("first-time buyer relief reduces the amount due", async ({ page }) => {
    await page.getByLabel("Purchase price").fill("300000");
    await expect(page.getByText("£5,000")).toBeVisible();

    await page.getByLabel("This is my first home").check();
    await expect(page.getByText("£0", { exact: true })).toBeVisible();
  });

  test("checking additional property unchecks first-time buyer and adds the surcharge", async ({ page }) => {
    await page.getByLabel("Purchase price").fill("300000");
    await page.getByLabel("This is my first home").check();
    await page.getByLabel("This is an additional property (second home, buy-to-let)").check();

    await expect(page.getByLabel("This is my first home")).not.toBeChecked();
    // standard £5,000 + 5% surcharge on £300,000 = £20,000
    await expect(page.getByText("£20,000")).toBeVisible();
  });

  test("switching to Wales shows the Land Transaction Tax result", async ({ page }) => {
    await page.getByRole("button", { name: "Wales" }).click();
    await page.getByLabel("Purchase price").fill("300000");
    // 6% (225k-300k] = £4,500
    await expect(page.getByText("£4,500")).toBeVisible();
    await expect(page.getByText("Land Transaction Tax (LTT)")).toBeVisible();
  });
});
