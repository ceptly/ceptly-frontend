import { test, expect } from "@playwright/test";

/**
 * Onboarding wizard. A user with a token but onboarding NOT complete is routed
 * here by middleware, so we seed only the access_token cookie (the `authedPage`
 * fixture marks onboarding complete, which would redirect away).
 *
 * The wizard is client-driven until the final submit, so the first steps render
 * without backend data.
 */
test.describe("Onboarding wizard", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    const url = new URL(baseURL ?? "http://localhost:3000");
    await context.addCookies([
      { name: "access_token", value: "e2e-access-token", domain: url.hostname, path: "/" },
    ]);
  });

  test("renders the first step for a freshly registered user", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    await expect(page).toHaveURL(/\/onboarding/);
    // The role-selection step offers a Founder/Executive option.
    await expect(page.getByText(/founder|executive|team lead/i).first()).toBeVisible();
  });
});
