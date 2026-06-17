import { test as base, expect } from "@playwright/test";

/**
 * Test fixtures.
 *
 * `authedPage` seeds the session cookies the middleware checks so protected
 * routes are reachable. Billing enforcement is disabled in the test app env
 * (see playwright.config.ts), so an access token + completed onboarding is
 * enough — no Stripe round-trip required.
 */
const SESSION_COOKIES = [
  { name: "access_token", value: "e2e-access-token" },
  { name: "onboarding_complete", value: "1" },
  { name: "subscription_active", value: "1" },
  { name: "billing_role", value: "owner" },
  { name: "billing_can_manage", value: "1" },
  { name: "workspace_name", value: "E2E Workspace" },
];

export const test = base.extend<{ authedPage: import("@playwright/test").Page }>(
  {
    authedPage: async ({ page, context, baseURL }, use) => {
      const url = new URL(baseURL ?? "http://localhost:3000");
      await context.addCookies(
        SESSION_COOKIES.map((c) => ({
          ...c,
          domain: url.hostname,
          path: "/",
        })),
      );
      await use(page);
    },
  },
);

export { expect };
