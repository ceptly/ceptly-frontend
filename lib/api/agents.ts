import { resolveApiBaseUrl } from "./auth";
import type {
  ConversationResultDestination,
  WorkspaceSchedule,
} from "./types";
import { parseJsonResponse } from "./http";

export type AgentApiDestination = "dm" | "channel";
export type AgentApiTrigger = "scheduled" | "one_off";
export type AgentApiStyle = "broadcast" | "sequential";
export type AgentContextIntegration = "linear" | "jira" | "monday";

export interface AgentDeployBody {
  destination: AgentApiDestination;
  trigger?: AgentApiTrigger;
  name: string;
  persona_preset?: string;
  agent_persona?: string | null;
  conversation_goal?: string | null;
  agent_notes?: string | null;
  intent?: "gather" | "inform";
  roster_member_ids: string[];
  context_integrations?: AgentContextIntegration[];
  result_destinations?: ConversationResultDestination[];
  schedule: WorkspaceSchedule;
  channel_id?: string;
  style?: AgentApiStyle;
  template_id?: string;
  topic?: string;
  delivery_facts?: string;
}

export interface DeployedAgent {
  destination: AgentApiDestination;
  agentId?: string;
  sessionsStarted?: number;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function writeAgents<T>(
  method: "POST" | "PUT",
  accessToken: string,
  workspaceId: string,
  path: string,
  body: unknown,
): Promise<T & { success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/agents${path}`,
      {
        method,
        headers: authHeaders(accessToken),
        body: JSON.stringify(body),
      },
    );
    return parseJsonResponse<T>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    } as T & { success: boolean; error?: string };
  }
}

function postAgents<T>(
  accessToken: string,
  workspaceId: string,
  path: string,
  body: unknown,
): Promise<T & { success: boolean; error?: string }> {
  return writeAgents<T>("POST", accessToken, workspaceId, path, body);
}

export function deployAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<{ success: boolean; error?: string; data?: DeployedAgent }> {
  return postAgents<{ data?: DeployedAgent }>(
    accessToken,
    workspaceId,
    "",
    body,
  );
}

export function previewAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<{ success: boolean; error?: string; data?: { opener: string } }> {
  return postAgents<{ data?: { opener: string } }>(
    accessToken,
    workspaceId,
    "/preview",
    body,
  );
}

export function testAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<{
  success: boolean;
  error?: string;
  data?: { sessionsStarted: number };
}> {
  return postAgents<{ data?: { sessionsStarted: number } }>(
    accessToken,
    workspaceId,
    "/test",
    body,
  );
}

async function getAgents<T>(
  accessToken: string,
  workspaceId: string,
  path: string,
): Promise<T & { success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/agents${path}`,
      { headers: authHeaders(accessToken) },
    );
    return parseJsonResponse<T>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    } as T & { success: boolean; error?: string };
  }
}

async function deleteAgents<T>(
  accessToken: string,
  workspaceId: string,
  path: string,
): Promise<T & { success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/agents${path}`,
      { method: "DELETE", headers: authHeaders(accessToken) },
    );
    return parseJsonResponse<T>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    } as T & { success: boolean; error?: string };
  }
}

export function setAgentEnabled(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  return postAgents<Record<string, never>>(
    accessToken,
    workspaceId,
    `/${agentId}/enabled`,
    { enabled },
  );
}

export function deleteAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<{ success: boolean; error?: string }> {
  return deleteAgents<Record<string, never>>(accessToken, workspaceId, `/${agentId}`);
}

export function updateAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  body: AgentDeployBody,
): Promise<{ success: boolean; error?: string; data?: { agent: AgentFull } }> {
  return writeAgents<{ data?: { agent: AgentFull } }>(
    "PUT",
    accessToken,
    workspaceId,
    `/${agentId}`,
    body,
  );
}

export interface AgentFull {
  id: string;
  destination: "dm" | "channel";
  trigger: "scheduled" | "one_off";
  name: string;
  summary: string | null;
  persona_preset: string | null;
  agent_persona: string | null;
  conversation_goal: string | null;
  agent_notes: string | null;
  context_integrations: string[];
  result_destinations: ConversationResultDestination[];
  timezone: string;
  frequency: "daily" | "specific_days";
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
  channel_id: string | null;
  style: "broadcast" | "sequential" | null;
  roster_member_ids: string[];
}

export interface AgentSessionRow {
  session_id: string;
  status: "active" | "completed" | "cancelled";
  destination: "dm" | "channel";
  started_at: string;
  completed_at: string | null;
  scheduled_fire_at: string | null;
  summary_text: string | null;
}

export interface AgentSessionParticipant {
  id: string;
  roster_member_id: string | null;
  platform_user_id: string | null;
  dm_channel_id: string | null;
  status: "in_progress" | "completed" | "abandoned";
  started_at: string | null;
  completed_at: string | null;
}

export interface AgentSessionMessage {
  id: string;
  participant_id: string | null;
  role: "agent" | "ic";
  roster_member_id: string | null;
  content: string;
  created_at: string;
}

export interface AgentSessionOutcome {
  roster_member_id: string;
  summary: string | null;
  tasks: unknown[];
  blockers: unknown[];
}

export interface AgentSessionDetail {
  session: AgentSessionRow;
  participants: AgentSessionParticipant[];
  messages: AgentSessionMessage[];
  outcomes: AgentSessionOutcome[];
}

export function getAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<{ success: boolean; error?: string; data?: { agent: AgentFull } }> {
  return getAgents<{ data?: { agent: AgentFull } }>(
    accessToken,
    workspaceId,
    `/${agentId}`,
  );
}

export function getAgentSessions(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<{ success: boolean; error?: string; data?: { sessions: AgentSessionRow[] } }> {
  return getAgents<{ data?: { sessions: AgentSessionRow[] } }>(
    accessToken,
    workspaceId,
    `/${agentId}/sessions`,
  );
}

export function getAgentSessionDetail(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  sessionId: string,
): Promise<{ success: boolean; error?: string; data?: AgentSessionDetail }> {
  return getAgents<{ data?: AgentSessionDetail }>(
    accessToken,
    workspaceId,
    `/${agentId}/sessions/${sessionId}`,
  );
}
