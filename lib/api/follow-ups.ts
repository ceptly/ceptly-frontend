import { apiFetch, type ApiResult } from "./client";
import type { ScheduledFollowUp } from "./types";

export function cancelFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/follow-ups/${followUpId}`, {
    token: accessToken,
    method: "DELETE",
  });
}

/** Targeted list for a single agent's pending follow-ups (used by the agent
 * detail page to avoid fetching the full workspace activity payload). */
export function listFollowUpsForAgent(
  accessToken: string,
  workspaceId: string,
  agentId: string,
): Promise<ApiResult<{ follow_ups: ScheduledFollowUp[] }>> {
  return apiFetch(
    `/api/workspaces/${workspaceId}/follow-ups?agent_id=${encodeURIComponent(agentId)}`,
    { token: accessToken },
  );
}

export function rescheduleFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
  scheduledFor: string,
): Promise<ApiResult<{ scheduled_for?: string }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/follow-ups/${followUpId}`, {
    token: accessToken,
    method: "PATCH",
    body: { scheduled_for: scheduledFor },
  });
}
