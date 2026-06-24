import { apiFetch, type ApiResult } from "./client";

export interface WorkspaceIntegration {
  id: string;
  name: string;
  description: string;
  available: boolean;
  connected: boolean;
  connectedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export function listIntegrations(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ integrations: WorkspaceIntegration[] }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/integrations`, {
    token: accessToken,
  });
}
