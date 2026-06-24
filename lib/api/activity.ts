import { apiFetch, type ApiResult } from "./client";
import type { WorkspaceActivity } from "./types";

export function getWorkspaceActivity(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ activity: WorkspaceActivity }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/activity`, {
    token: accessToken,
  });
}

export function getWorkspaceAttentionCount(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ attention_count: number }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/activity/attention-count`, {
    token: accessToken,
  });
}

export function dismissActivityAttentionItem(
  accessToken: string,
  workspaceId: string,
  input: {
    item_type: "roster_tracker_mismatch";
    item_key: string;
  },
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/activity/dismiss`, {
    token: accessToken,
    method: "POST",
    body: input,
  });
}
