import { resolveApiBaseUrl } from "./auth";
import type { ConversationResultDestination, WorkspaceSchedule } from "./types";
import { parseJsonResponse } from "./http";

export type AgentApiKind = "checkin" | "reachout" | "standup";
export type AgentApiTriggerMode = "schedule" | "manual" | "event";
export type AgentApiStyle = "broadcast" | "sequential";
export type AgentContextIntegration = "linear" | "jira" | "monday";

export interface AgentDeployBody {
  kind: AgentApiKind;
  trigger_mode?: AgentApiTriggerMode;
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
  kind: AgentApiKind;
  agentId?: string;
  sessionsStarted?: number;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function postAgents<T>(
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
        method: "POST",
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
