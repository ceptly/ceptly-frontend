import { apiFetch, type ApiResult } from "./client";

export interface MondayConnectionStatus {
  connected: boolean;
  accountId?: string | null;
  accountName?: string | null;
  accountSlug?: string | null;
  connectedAt?: string | null;
}

export function getMondayConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<MondayConnectionStatus>> {
  return apiFetch(`/api/workspaces/${workspaceId}/monday/status`, {
    token: accessToken,
  });
}

export function getMondayInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<ApiResult<{ url: string }>> {
  const params = new URLSearchParams({ return_to: returnTo });
  return apiFetch(
    `/api/workspaces/${workspaceId}/monday/install-url?${params.toString()}`,
    { token: accessToken },
  );
}

export function disconnectMonday(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/monday/disconnect`, {
    token: accessToken,
    method: "POST",
  });
}
