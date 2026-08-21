import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("car lease vs finance vs cash comparison", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/calculators/car");
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("a scenario with a lease quote shows all three ownership paths compared", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("Compare me");
    await page.getByLabel("Price").fill("20000");
    await page.getByLabel("Deposit").fill("2000");
    await page.getByLabel("APR %").fill("0");
    await page.getByLabel("Term (months)").fill("36");
    await page.getByLabel("Insurance / year").fill("600");
    await page.getByLabel("Road tax (VED) / year").fill("180");
    await page.getByLabel("Fuel + maintenance / month").fill("100");
    await page.getByLabel("Lease quote / month (optional)").fill("350");
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("Compare me").locator("xpath=ancestor::li");
    await card.getByText("Compare cash / finance / lease").click();

    // "Cash"/"Finance" also appear elsewhere on the card (the standalone cost
    // breakdown), so scope to rows unique to the comparison table itself.
    await expect(card.getByText("Total over term")).toBeVisible();
    await expect(card.getByText("You own")).toBeVisible();
    const table = card.locator("table");
    await expect(table.getByText("Cash", { exact: true })).toBeVisible();
    await expect(table.getByText("Finance", { exact: true })).toBeVisible();
    await expect(table.getByText("Lease", { exact: true })).toBeVisible();
  });

  test("without a lease quote, only cash and finance appear with a hint to add one", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("No lease");
    await page.getByLabel("Price").fill("15000");
    await page.getByLabel("Deposit").fill("1000");
    await page.getByLabel("APR %").fill("5");
    await page.getByLabel("Term (months)").fill("36");
    await page.getByLabel("Insurance / year").fill("500");
    await page.getByLabel("Road tax (VED) / year").fill("180");
    await page.getByLabel("Fuel + maintenance / month").fill("100");
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("No lease").locator("xpath=ancestor::li");
    await card.getByText("Compare cash / finance / lease").click();

    await expect(card.getByText("Add a lease quote to this scenario to compare against leasing.")).toBeVisible();
  });
});
