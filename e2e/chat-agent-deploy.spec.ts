import { test, expect } from "./fixtures/test";
import { ChatPage } from "./pages/chat.page";

/**
 * FLAGSHIP FLOW — chat -> inline agent_form -> Deploy -> agent_deployed.
 *
 * The stub backend replays the chat SSE protocol (e2e/mock-server/server.mjs).
 * Selectors use stable data-testid hooks on the chat composer and deploy card.
 */
test.describe("Chat -> inline agent deploy", () => {
  test("chat surface loads for an authenticated user", async ({ authedPage }) => {
    const chat = new ChatPage(authedPage);
    await chat.goto();

    await expect(authedPage).toHaveURL(/\/chat$/);
    await expect(chat.messageInput()).toBeVisible();
  });

  test("renders the inline agent setup card from the chat stream", async ({
    authedPage,
  }) => {
    const chat = new ChatPage(authedPage);
    await chat.goto();

    await chat.sendMessage("Set up a daily standup for my team");

    await expect(chat.deployProposal()).toBeVisible({ timeout: 15_000 });
    await expect(chat.deployButton()).toBeEnabled();
  });

  test("deploying the inline form shows the agent_deployed confirmation", async ({
    authedPage,
  }) => {
    const chat = new ChatPage(authedPage);
    await chat.goto();
    await chat.sendMessage("Set up a daily standup for my team");

    await expect(chat.deployButton()).toBeEnabled({ timeout: 15_000 });
    await chat.deployButton().click();
    await expect(chat.deployedConfirmation()).toBeVisible({ timeout: 15_000 });
    await expect(chat.deployedConfirmation()).toContainText("Agent deployed");
  });
});
