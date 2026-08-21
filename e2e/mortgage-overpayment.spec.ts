import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("mortgage overpayment calculator", () => {
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
    await page.getByLabel("Scenario name").fill("Overpay me");
    await page.getByRole("button", { name: "Mortgage" }).click();
    await page.getByLabel("Loan amount").fill("200000");
    await page.getByLabel("Interest rate %").fill("4");
    await page.getByLabel("Term (years)").fill("25");
    await page.getByLabel("Buildings insurance / year").fill("200");
    await page.getByLabel("Council tax / year").fill("1800");
    await page.getByRole("button", { name: "Add scenario" }).click();
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("setting a monthly overpayment shows interest and time saved", async ({ page }) => {
    const card = page.getByText("Overpay me").locator("xpath=ancestor::li");
    await card.getByText("Overpayment calculator").click();

    await card.getByLabel("Extra / month").fill("200");
    await card.getByRole("button", { name: "Update overpayment" }).click();

    await expect(card.getByText("Interest saved")).toBeVisible();
    await expect(card.getByText("Time saved")).toBeVisible();
  });
});
