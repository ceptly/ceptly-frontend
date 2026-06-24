import { apiFetch, type ApiResult } from "./client";

export interface SlackConnectionStatus {
  connected: boolean;
  searchEnabled?: boolean;
  rosterChatEnabled?: boolean;
  teamId?: string | null;
  teamName?: string | null;
  installedAt?: string | null;
}

export function getSlackConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<SlackConnectionStatus>> {
  return apiFetch(`/api/workspaces/${workspaceId}/slack/status`, {
    token: accessToken,
  });
}

export function getSlackInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<ApiResult<{ url: string }>> {
  const params = new URLSearchParams({ return_to: returnTo });
  return apiFetch(
    `/api/workspaces/${workspaceId}/slack/install-url?${params.toString()}`,
    { token: accessToken },
  );
}

export function disconnectSlack(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/slack/disconnect`, {
    token: accessToken,
    method: "POST",
  });
}
