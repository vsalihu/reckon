import { test, expect } from "@playwright/test";

test.describe("sign up", () => {
  // Hits Supabase's real signUp() (unlike the income/goals specs, which use
  // the admin API to skip email confirmation) since that's the flow this
  // test exists to verify. Supabase's shared email service has a low hourly
  // rate limit — heavy local iteration can trip it, showing "email rate
  // limit exceeded" instead of navigating to check-email. That's expected
  // environment behaviour, not an app bug; it clears once the window resets.
  test("creating an account with email/password sends you to check your email", async ({ page }) => {
    const email = `viktor.salihu2017+e2e${Date.now()}${Math.random().toString(36).slice(2, 6)}@gmail.com`;

    await page.goto("/sign-up");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/sign-up\/check-email/);
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test("rejects a password that's too short", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill(`viktor.salihu2017+e2e${Date.now()}@gmail.com`);
    await page.getByLabel("Password").fill("short");

    const passwordField = page.getByLabel("Password");
    await expect(passwordField).toHaveJSProperty("validity.valid", false);
  });

  test("can navigate to sign in", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
