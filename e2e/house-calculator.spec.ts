import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("house cost calculator", () => {
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

  test("rent mode totals rent + bills + council tax", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("City flat");
    // rent mode is the default toggle state
    await page.getByLabel("Monthly rent").fill("1200");
    await page.getByLabel("Monthly bills").fill("150");
    await page.getByLabel("Council tax / month").fill("130");
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("City flat").locator("xpath=ancestor::li");
    await expect(card).toBeVisible();
    await expect(card.getByText("£1,480")).toBeVisible();
  });

  test("mortgage mode totals repayment + insurance/12 + council tax/12", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("3-bed semi");
    await page.getByRole("button", { name: "Mortgage" }).click();
    await page.getByLabel("Loan amount").fill("240000");
    await page.getByLabel("Interest rate %").fill("0"); // 0% for predictable arithmetic
    await page.getByLabel("Term (years)").fill("20"); // 240000 / 240 = 1000 exactly
    await page.getByLabel("Buildings insurance / year").fill("240"); // -> 20/mo
    await page.getByLabel("Council tax / year").fill("1800"); // -> 150/mo
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("3-bed semi").locator("xpath=ancestor::li");
    await expect(card).toBeVisible();
    // total = 1000 (mortgage) + 20 (insurance) + 150 (council tax) = 1170
    await expect(card.getByText("£1,170")).toBeVisible();
  });
});
