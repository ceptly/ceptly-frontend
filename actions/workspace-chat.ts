"use server";

import { z } from "zod";

import { markChatFormDeployed } from "@/lib/api/workspace-chat-history";
import { getAccessToken } from "@/lib/auth/server";

const markDeployedArgsSchema = z.object({
  workspaceId: z.string().uuid(),
  sessionId: z.string().uuid(),
  name: z.string().trim().max(100).optional(),
});

export async function markChatFormDeployedAction(input: {
  workspaceId: string;
  sessionId: string;
  name?: string;
}): Promise<{ error?: string }> {
  const parsed = markDeployedArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await markChatFormDeployed(
    token,
    parsed.data.workspaceId,
    parsed.data.sessionId,
    parsed.data.name,
  );

  if (!result.success) {
    return { error: result.error ?? "Could not save deployment status." };
  }

  return {};
}
