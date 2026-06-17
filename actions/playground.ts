"use server";

import {
  deletePlaygroundConversation as deletePlaygroundConversationApi,
  getPlaygroundConversation as getPlaygroundConversationApi,
  listPlaygroundAgents as listPlaygroundAgentsApi,
  listPlaygroundConversations as listPlaygroundConversationsApi,
  postPlaygroundReply as postPlaygroundReplyApi,
  runPlaygroundAgent as runPlaygroundAgentApi,
  type PlaygroundAgentSummary,
  type PlaygroundConversationDetail,
  type PlaygroundConversationSummary,
} from "@/lib/api/playground";
import { getAccessToken } from "@/lib/auth/server";

export async function listPlaygroundAgentsAction(input: {
  workspaceId: string;
}): Promise<{ error?: string; agents?: PlaygroundAgentSummary[] }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await listPlaygroundAgentsApi(token, input.workspaceId);
  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to load playground agents." };
  }
  return { agents: result.data.agents };
}

export async function listPlaygroundConversationsAction(input: {
  workspaceId: string;
}): Promise<{
  error?: string;
  conversations?: PlaygroundConversationSummary[];
}> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await listPlaygroundConversationsApi(token, input.workspaceId);
  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to load conversations." };
  }
  return { conversations: result.data.conversations };
}

export async function getPlaygroundConversationAction(input: {
  workspaceId: string;
  sessionId: string;
}): Promise<{ error?: string; conversation?: PlaygroundConversationDetail }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await getPlaygroundConversationApi(
    token,
    input.workspaceId,
    input.sessionId,
  );
  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to load the conversation." };
  }
  return { conversation: result.data.conversation };
}

export async function deletePlaygroundConversationAction(input: {
  workspaceId: string;
  sessionId: string;
}): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await deletePlaygroundConversationApi(
    token,
    input.workspaceId,
    input.sessionId,
  );
  if (!result.success) {
    return { error: result.error ?? "Failed to delete the conversation." };
  }
  return {};
}

export async function runPlaygroundAgentAction(input: {
  workspaceId: string;
  agentId: string;
}): Promise<{ error?: string; sessionId?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await runPlaygroundAgentApi(
    token,
    input.workspaceId,
    input.agentId,
  );
  if (!result.success || !result.data) {
    return { error: result.error ?? "Could not start the conversation." };
  }
  return { sessionId: result.data.sessionId };
}

export async function postPlaygroundReplyAction(input: {
  workspaceId: string;
  sessionId: string;
  rosterMemberId: string;
  text: string;
}): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "You must be signed in." };

  const result = await postPlaygroundReplyApi(
    token,
    input.workspaceId,
    input.sessionId,
    input.rosterMemberId,
    input.text,
  );
  if (!result.success) {
    return { error: result.error ?? "Could not send the reply." };
  }
  return {};
}
