"use server";

import { runConversationNow } from "@/lib/api/conversations";
import { runStandupNow } from "@/lib/api/standups";
import { getAccessToken } from "@/lib/auth/server";

export async function runConversationAgentAction(input: {
  workspaceId: string;
  conversationId: string;
}): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }

  await runConversationNow(token, input.workspaceId, input.conversationId);
}

export async function runStandupAgentAction(input: {
  workspaceId: string;
  standupId: string;
}): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    return;
  }

  await runStandupNow(token, input.workspaceId, input.standupId);
}
