import type { Page } from "@playwright/test";

/** Page Object for Settings -> Billing. */
export class BillingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/settings/billing");
  }

  /** Tier labels surfaced from the billing fixture. */
  proLabel() {
    return this.page.getByText(/\bPro\b/).first();
  }
}
