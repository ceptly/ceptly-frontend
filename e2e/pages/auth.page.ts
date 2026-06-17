import type { Page, Locator } from "@playwright/test";

/** Page Object for /auth (sign-in / sign-up). */
export class AuthPage {
  readonly page: Page;
  readonly googleButton: Locator;
  readonly toggleButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.googleButton = page.getByText(/continue with google/i);
    this.toggleButton = page.getByRole("button", { name: /create account/i });
    this.emailInput = page.getByLabel(/^email$/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.submitButton = page.getByRole("button", { name: /^sign in$/i });
  }

  async goto(query = "") {
    await this.page.goto(`/auth${query}`);
  }

  async switchToSignUp() {
    await this.toggleButton.click();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
