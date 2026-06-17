import type { Page } from "@playwright/test";

/** Page Object for /chat and the inline agent-deploy card. */
export class ChatPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/chat");
  }

  messageInput() {
    return this.page.getByTestId("chat-message-input");
  }

  async sendMessage(text: string) {
    const input = this.messageInput();
    await input.fill(text);
    await input.press("Enter");
  }

  deployProposal() {
    return this.page.getByTestId("agent-deploy-proposal");
  }

  deployButton() {
    return this.page.getByTestId("agent-deploy-button");
  }

  deployedConfirmation() {
    return this.page.getByTestId("agent-deployed-confirmation");
  }
}
