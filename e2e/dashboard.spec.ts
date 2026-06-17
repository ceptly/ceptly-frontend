import { test, expect } from "./fixtures/test";
import { DashboardPage } from "./pages/dashboard.page";

/**
 * Authenticated dashboard render against the stub backend's dashboard fixture.
 * Asserts the route resolves (no redirect to /auth or /subscribe) and the app
 * shell renders — robust to fixture detail. Add KPI-value assertions once the
 * fixture is confirmed against the live dashboard DTO.
 */
test.describe("Founder dashboard", () => {
  test("loads for an authenticated owner", async ({ authedPage }) => {
    const dashboard = new DashboardPage(authedPage);
    await dashboard.goto();

    await expect(authedPage).toHaveURL(/\/dashboard$/);
    await expect(dashboard.nav()).toBeVisible();
  });
});
