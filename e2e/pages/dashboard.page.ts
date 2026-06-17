import type { Page } from "@playwright/test";

/** Page Object for the founder dashboard. */
export class DashboardPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  /** The main app chrome (sidebar nav) that renders on every authed route. */
  nav() {
    return this.page.getByRole("navigation").first();
  }
}
