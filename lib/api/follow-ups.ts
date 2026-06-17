import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";
import type { ScheduledFollowUp } from "./types";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function cancelFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/follow-ups/${followUpId}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
      },
    );
    return parseJsonResponse<Record<string, never>>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

/** Targeted list for a single agent's pending follow-ups (used by the agent
 * detail page to avoid fetching the full workspace activity payload). */
export async function listFollowUpsForAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<{
  success: boolean;
  data?: { follow_ups: ScheduledFollowUp[] };
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const url = `${base}/api/workspaces/${workspaceId}/follow-ups?agent_id=${encodeURIComponent(agentId)}`;
    const response = await fetch(url, {
      headers: authHeaders(accessToken),
      cache: "no-store",
    });
    return parseJsonResponse<{ follow_ups: ScheduledFollowUp[] }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function rescheduleFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
  scheduledFor: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { scheduled_for?: string };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/follow-ups/${followUpId}`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduled_for: scheduledFor }),
      },
    );
    return parseJsonResponse<{ data?: { scheduled_for?: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
