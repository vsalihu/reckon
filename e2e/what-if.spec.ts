import { test, expect, type Locator } from "@playwright/test";
import { createConfirmedTestUser, deleteTestUser, TEST_PASSWORD } from "./support/test-user";

async function setRange(slider: Locator, value: string) {
  // React tracks values through its own property setter, so a plain
  // `input.value = x` assignment is invisible to its onChange — go through
  // the native HTMLInputElement setter directly, as React's own testing
  // guidance recommends for range/text inputs set outside user typing.
  await slider.evaluate((el, val) => {
    const input = el as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    nativeSetter.call(input, val);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test.describe("what-if slider", () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ page }) => {
    ({ id: userId, email } = await createConfirmedTestUser("GBP"));

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await page.getByLabel("Goal name").fill("Explorable goal");
    await page.getByLabel("Target amount").fill("1000");
    await page.getByLabel("Deadline").fill(nextYear.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create goal" }).click();
    await page.getByText("Explorable goal").click();
    await expect(page).toHaveURL(/\/goals\//);
  });

  test.afterEach(async () => {
    await deleteTestUser(userId);
  });

  test("moving the slider live-updates the projected completion date, no save required", async ({ page }) => {
    await expect(page.getByText("What if?")).toBeVisible();

    // £1000 target over ~1 year -> suggested pace ~£19/week, so the slider's
    // max (~3x suggested, see WhatIfSlider) comfortably covers this value
    // without the browser silently clamping it.
    const slider = page.getByLabel(/per week/);
    const initialText = await page.getByText(/Done by|never completes/).textContent();

    await setRange(slider, "50");
    await expect(page.getByText("£50 per week")).toBeVisible();

    const updatedText = await page.getByText(/Done by|never completes/).textContent();
    expect(updatedText).not.toBe(initialText);

    // Reload confirms nothing was persisted — purely client-side exploration.
    await page.reload();
    await expect(page.getByLabel(/per week/)).not.toHaveValue("50");
  });

  test("switching to monthly changes the projection", async ({ page }) => {
    await page.getByRole("button", { name: "Monthly" }).click();
    await expect(page.getByText(/per month/)).toBeVisible();
  });

  test("a zero contribution says the goal would never complete", async ({ page }) => {
    const slider = page.getByLabel(/per week/);
    await setRange(slider, "0");
    await expect(page.getByText("never completes")).toBeVisible();
  });
});
