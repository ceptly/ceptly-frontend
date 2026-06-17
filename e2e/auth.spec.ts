import { test, expect } from "@playwright/test";

import { AuthPage } from "./pages/auth.page";

/**
 * The /auth page is client-rendered, so these cases need no backend and are the
 * most stable in the suite — good smoke tests that the app boots and routes.
 */
test.describe("Authentication page", () => {
  test("renders the sign-in form by default", async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(auth.submitButton).toBeVisible();
    await expect(auth.googleButton).toBeVisible();
  });

  test("Continue with Google links to the OAuth start endpoint", async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    const href = await auth.googleButton
      .locator("xpath=ancestor-or-self::a")
      .first()
      .getAttribute("href");
    expect(href).toContain("/auth/google");
  });

  test("toggles to sign-up and shows the full-name field", async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.switchToSignUp();

    await expect(page.getByText(/create your ceptly account/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });

  test("starts in sign-up mode when ?mode=sign-up", async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto("?mode=sign-up");

    await expect(page.getByText(/create your ceptly account/i)).toBeVisible();
  });
});
