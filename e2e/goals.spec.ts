import { test, expect } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

test.describe("savings goals", () => {
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

  test("creating a goal and funding it via quick-add updates its progress", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const deadline = nextYear.toISOString().slice(0, 10);

    await page.getByLabel("Goal name").fill("Car deposit");
    await page.getByLabel("Target amount").fill("2000");
    await page.getByLabel("Deadline").fill(deadline);
    await page.getByRole("button", { name: "Create goal" }).click();

    const goalCard = page.getByText("Car deposit").locator("xpath=ancestor::li");
    await expect(goalCard).toBeVisible();
    await expect(goalCard.getByText("£0", { exact: true })).toBeVisible();

    await goalCard.getByRole("button", { name: "+£25" }).click();
    await expect(goalCard.getByText("£25", { exact: true })).toBeVisible();

    await goalCard.getByRole("button", { name: "+£100" }).click();
    await expect(goalCard.getByText("£125", { exact: true })).toBeVisible();
  });

  test("deleting a goal removes it from the list", async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.getByLabel("Goal name").fill("Temporary goal");
    await page.getByLabel("Target amount").fill("500");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();

    await expect(page.getByText("Temporary goal")).toBeVisible();

    await page.getByRole("button", { name: "Delete Temporary goal" }).click();
    await expect(page.getByText("Temporary goal")).not.toBeVisible();
  });
});
