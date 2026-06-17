import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

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

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

const UNREACHABLE = "Could not reach the API. Is the backend running?";

export async function listPlaygroundAgents(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { agents: PlaygroundAgentSummary[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/agents`,
      { headers: authHeaders(accessToken), cache: "no-store" },
    );
    return parseJsonResponse<{ data?: { agents: PlaygroundAgentSummary[] } }>(
      response,
    );
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}

export async function listPlaygroundConversations(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversations: PlaygroundConversationSummary[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/conversations`,
      { headers: authHeaders(accessToken), cache: "no-store" },
    );
    return parseJsonResponse<{
      data?: { conversations: PlaygroundConversationSummary[] };
    }>(response);
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}

export async function getPlaygroundConversation(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { conversation: PlaygroundConversationDetail };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/conversations/${sessionId}`,
      { headers: authHeaders(accessToken), cache: "no-store" },
    );
    return parseJsonResponse<{
      data?: { conversation: PlaygroundConversationDetail };
    }>(response);
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}

export async function deletePlaygroundConversation(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/conversations/${sessionId}`,
      { method: "DELETE", headers: authHeaders(accessToken) },
    );
    return parseJsonResponse<Record<string, never>>(response);
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}

export async function runPlaygroundAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { sessionId: string };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/run`,
      {
        method: "POST",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_id: agentId }),
      },
    );
    return parseJsonResponse<{ data?: { sessionId: string } }>(response);
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}

export async function postPlaygroundReply(
  accessToken: string,
  workspaceId: string,
  sessionId: string,
  rosterMemberId: string,
  text: string,
): Promise<{ success: boolean; error?: string; data?: { handled: boolean } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/playground/conversations/${sessionId}/reply`,
      {
        method: "POST",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roster_member_id: rosterMemberId, text }),
      },
    );
    return parseJsonResponse<{ data?: { handled: boolean } }>(response);
  } catch {
    return { success: false, error: UNREACHABLE };
  }
}
