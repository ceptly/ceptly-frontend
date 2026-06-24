import { apiFetch, type ApiResult } from "./client";

export type PlaygroundDestination = "dm" | "channel";
export type PlaygroundStyle = "broadcast" | "sequential";
export type PlaygroundSessionStatus = "active" | "completed" | "cancelled";

export interface PlaygroundAgentSummary {
  id: string;
  name: string;
  destination: PlaygroundDestination;
  style: PlaygroundStyle | null;
  trigger: "scheduled" | "one_off";
}

export interface PlaygroundConversationSummary {
  sessionId: string;
  agentId: string;
  agentName: string;
  destination: PlaygroundDestination;
  style: PlaygroundStyle | null;
  status: PlaygroundSessionStatus;
  startedAt: string;
  lastMessageAt: string | null;
  preview: string | null;
}

export interface PlaygroundConversationParticipant {
  id: string;
  rosterMemberId: string | null;
  displayName: string | null;
  platformUserId: string | null;
  status: "in_progress" | "completed" | "abandoned";
}

export interface PlaygroundConversationMessage {
  id: string;
  role: "agent" | "ic";
  rosterMemberId: string | null;
  platformUserId: string | null;
  content: string;
  createdAt: string;
}

export interface PlaygroundConversationDetail {
  session: {
    sessionId: string;
    agentId: string;
    agentName: string;
    destination: PlaygroundDestination;
    style: PlaygroundStyle | null;
    status: PlaygroundSessionStatus;
    startedAt: string;
    completedAt: string | null;
  };
  participants: PlaygroundConversationParticipant[];
  messages: PlaygroundConversationMessage[];
}

const playgroundBase = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}/playground`;

export function listPlaygroundAgents(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ agents: PlaygroundAgentSummary[] }>> {
  return apiFetch(`${playgroundBase(workspaceId)}/agents`, {
    token: accessToken,
  });
}

export function listPlaygroundConversations(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ conversations: PlaygroundConversationSummary[] }>> {
  return apiFetch(`${playgroundBase(workspaceId)}/conversations`, {
    token: accessToken,
  });
}

export function getPlaygroundConversation(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
): Promise<ApiResult<{ conversation: PlaygroundConversationDetail }>> {
  return apiFetch(`${playgroundBase(workspaceId)}/conversations/${sessionId}`, {
    token: accessToken,
  });
}

export function deletePlaygroundConversation(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`${playgroundBase(workspaceId)}/conversations/${sessionId}`, {
    token: accessToken,
    method: "DELETE",
  });
}

export function runPlaygroundAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<ApiResult<{ sessionId: string }>> {
  return apiFetch(`${playgroundBase(workspaceId)}/run`, {
    token: accessToken,
    method: "POST",
    body: { agent_id: agentId },
  });
}

export function postPlaygroundReply(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
  rosterMemberId: string,
  text: string,
): Promise<ApiResult<{ handled: boolean }>> {
  return apiFetch(
    `${playgroundBase(workspaceId)}/conversations/${sessionId}/reply`,
    {
      token: accessToken,
      method: "POST",
      body: { roster_member_id: rosterMemberId, text },
    },
  );
}
