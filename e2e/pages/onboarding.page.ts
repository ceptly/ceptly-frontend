import type { Page } from "@playwright/test";

/** Page Object for the onboarding wizard. */
export class OnboardingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/onboarding");
  }

  /** Advance the wizard; the CTA label is "Continue" / "Next" depending on step. */
  continueButton() {
    return this.page.getByRole("button", { name: /continue|next/i }).first();
  }
}
