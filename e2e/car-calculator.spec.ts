import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("car cost calculator", () => {
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

  test("creating a scenario shows the total monthly cost, deleting removes it", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("Used Golf");
    await page.getByLabel("Price").fill("15000");
    await page.getByLabel("Deposit").fill("2000");
    await page.getByLabel("APR %").fill("0"); // 0% for predictable arithmetic
    await page.getByLabel("Term (months)").fill("26"); // 13000 / 26 = 500 exactly
    await page.getByLabel("Insurance / year").fill("600"); // -> 50/mo
    await page.getByLabel("Road tax (VED) / year").fill("120"); // -> 10/mo
    await page.getByLabel("Fuel + maintenance / month").fill("90");
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("Used Golf").locator("xpath=ancestor::li");
    await expect(card).toBeVisible();
    // total = 500 (finance) + 50 (insurance) + 10 (road tax) + 90 (fuel) = 650
    await expect(card.getByText("£650")).toBeVisible();

    await card.getByRole("button", { name: "Delete Used Golf" }).click();
    await expect(page.getByText("Used Golf")).not.toBeVisible();
  });

  test("linking a scenario to a new goal creates and links it", async ({ page }) => {
    await page.getByLabel("Scenario name").fill("City runabout");
    await page.getByLabel("Price").fill("8000");
    await page.getByLabel("Deposit").fill("1000");
    await page.getByLabel("APR %").fill("5");
    await page.getByLabel("Term (months)").fill("36");
    await page.getByLabel("Insurance / year").fill("400");
    await page.getByLabel("Road tax (VED) / year").fill("180");
    await page.getByLabel("Fuel + maintenance / month").fill("80");
    await page.getByRole("button", { name: "Add scenario" }).click();

    const card = page.getByText("City runabout").locator("xpath=ancestor::li");
    await card.getByLabel("Linked savings goal").selectOption({ label: "+ Create new goal from this" });

    // Reflected on the dashboard as a new goal named after the scenario.
    await page.goto("/dashboard");
    await expect(page.getByText("City runabout deposit")).toBeVisible();
  });
});
