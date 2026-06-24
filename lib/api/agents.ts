import { apiFetch, type ApiResult } from "./client";
import type { ConversationResultDestination, WorkspaceSchedule } from "./types";

export type AgentApiDestination = "dm" | "channel";
export type AgentApiTrigger = "scheduled" | "one_off";
export type AgentApiStyle = "broadcast" | "sequential";
export type AgentApiRuntime = "live" | "playground";
export type AgentContextIntegration = "linear" | "jira" | "monday";

export interface AgentDeployBody {
  destination: AgentApiDestination;
  trigger?: AgentApiTrigger;
  runtime?: AgentApiRuntime;
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

/** All agent endpoints hang off the workspace's `/agents` path. */
function agentsRequest<TData>(
  accessToken: string,
  workspaceId: string,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {},
): Promise<ApiResult<TData>> {
  return apiFetch<TData>(`/api/workspaces/${workspaceId}/agents${path}`, {
    token: accessToken,
    ...options,
  });
}

export function deployAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<ApiResult<DeployedAgent>> {
  return agentsRequest(accessToken, workspaceId, "", { method: "POST", body });
}

export function previewAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<ApiResult<{ opener: string }>> {
  return agentsRequest(accessToken, workspaceId, "/preview", {
    method: "POST",
    body,
  });
}

export function testAgent(
  accessToken: string,
  workspaceId: string,
  body: AgentDeployBody,
): Promise<ApiResult<{ sessionsStarted: number }>> {
  return agentsRequest(accessToken, workspaceId, "/test", {
    method: "POST",
    body,
  });
}

export function setAgentEnabled(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  enabled: boolean,
): Promise<ApiResult<never>> {
  return agentsRequest(accessToken, workspaceId, `/${agentId}/enabled`, {
    method: "POST",
    body: { enabled },
  });
}

export function deleteAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<ApiResult<never>> {
  return agentsRequest(accessToken, workspaceId, `/${agentId}`, {
    method: "DELETE",
  });
}

export function updateAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  body: AgentDeployBody,
): Promise<ApiResult<{ agent: AgentFull }>> {
  return agentsRequest(accessToken, workspaceId, `/${agentId}`, {
    method: "PUT",
    body,
  });
}

export interface AgentFull {
  id: string;
  destination: "dm" | "channel";
  trigger: "scheduled" | "one_off";
  runtime: AgentApiRuntime;
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
): Promise<ApiResult<{ agent: AgentFull }>> {
  return agentsRequest(accessToken, workspaceId, `/${agentId}`);
}

export function getAgentSessions(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<ApiResult<{ sessions: AgentSessionRow[] }>> {
  return agentsRequest(accessToken, workspaceId, `/${agentId}/sessions`);
}

export function getAgentSessionDetail(
  accessToken: string,
  workspaceId: string,
  agentId: string,
  sessionId: string,
): Promise<ApiResult<AgentSessionDetail>> {
  return agentsRequest(
    accessToken,
    workspaceId,
    `/${agentId}/sessions/${sessionId}`,
  );
}
