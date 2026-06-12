import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export interface WorkspaceIntegration {
  id: string;
  name: string;
  description: string;
  available: boolean;
  connected: boolean;
  connectedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export async function listIntegrations(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { integrations: WorkspaceIntegration[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/integrations`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{
      data?: { integrations: WorkspaceIntegration[] };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
