import { test, expect } from "./fixtures/test";
import { BillingPage } from "./pages/billing.page";

/**
 * Billing settings render against the stub backend's billing fixture (Pro tier,
 * active). /settings/billing is billing-exempt in middleware, so it is always
 * reachable for an authed user.
 */
test.describe("Billing settings", () => {
  test("shows the current plan for an authenticated owner", async ({
    authedPage,
  }) => {
    const billing = new BillingPage(authedPage);
    await billing.goto();

    await expect(authedPage).toHaveURL(/\/settings\/billing$/);
    await expect(billing.proLabel()).toBeVisible();
  });
});
