import { apiFetch, type ApiResult } from "./client";

export interface LinearConnectionStatus {
  connected: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  connectedAt?: string | null;
}

export function getLinearConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<LinearConnectionStatus>> {
  return apiFetch(`/api/workspaces/${workspaceId}/linear/status`, {
    token: accessToken,
  });
}

export function getLinearInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<ApiResult<{ url: string }>> {
  const params = new URLSearchParams({ return_to: returnTo });
  return apiFetch(
    `/api/workspaces/${workspaceId}/linear/install-url?${params.toString()}`,
    { token: accessToken },
  );
}

export function disconnectLinear(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/linear/disconnect`, {
    token: accessToken,
    method: "POST",
  });
}
