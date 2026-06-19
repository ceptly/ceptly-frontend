"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  deleteChatSession,
  listChatSessionSummaries,
  loadChatSession,
  markChatFormDeployed,
  type ChatSessionSummary,
} from "@/lib/api/workspace-chat-history";
import type { SetupChatMessage } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

const workspaceSessionArgsSchema = z.object({
  workspaceId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function listChatSessionsAction(input: {
  workspaceId: string;
}): Promise<{ sessions?: ChatSessionSummary[]; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };
  const sessions = await listChatSessionSummaries(token, input.workspaceId);
  return { sessions };
}

export async function loadChatSessionAction(input: {
  workspaceId: string;
  sessionId: string;
}): Promise<{
  sessionId?: string;
  messages?: SetupChatMessage[];
  error?: string;
}> {
  const parsed = workspaceSessionArgsSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };
  const result = await loadChatSession(
    token,
    parsed.data.workspaceId,
    parsed.data.sessionId,
  );
  if (!result) return { error: "Session not found." };
  return { sessionId: result.sessionId ?? undefined, messages: result.messages };
}

export async function deleteChatSessionAction(input: {
  workspaceId: string;
  sessionId: string;
}): Promise<{ error?: string }> {
  const parsed = workspaceSessionArgsSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };
  const result = await deleteChatSession(
    token,
    parsed.data.workspaceId,
    parsed.data.sessionId,
  );
  if (!result.success) return { error: result.error };
  // Invalidate the cached /chat render so the deleted session doesn't reappear
  // when the user navigates back to the page (Next.js Router Cache).
  revalidatePath("/chat");
  return {};
}

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
