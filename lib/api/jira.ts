import { apiFetch, type ApiResult } from "./client";

export interface JiraConnectionStatus {
  connected: boolean;
  cloudId?: string | null;
  siteName?: string | null;
  siteUrl?: string | null;
  connectedAt?: string | null;
}

export function getJiraConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<JiraConnectionStatus>> {
  return apiFetch(`/api/workspaces/${workspaceId}/jira/status`, {
    token: accessToken,
  });
}

export function getJiraInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<ApiResult<{ url: string }>> {
  const params = new URLSearchParams({ return_to: returnTo });
  return apiFetch(
    `/api/workspaces/${workspaceId}/jira/install-url?${params.toString()}`,
    { token: accessToken },
  );
}

export function disconnectJira(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/jira/disconnect`, {
    token: accessToken,
    method: "POST",
  });
}
