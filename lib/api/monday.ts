import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export interface MondayConnectionStatus {
  connected: boolean;
  accountId?: string | null;
  accountName?: string | null;
  accountSlug?: string | null;
  connectedAt?: string | null;
}

export async function getMondayConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: MondayConnectionStatus;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/monday/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: MondayConnectionStatus }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getMondayInstallUrl(
  accessToken: string,
  workspaceId: string,
  returnTo: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { url: string };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const params = new URLSearchParams({ return_to: returnTo });
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/monday/install-url?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: { url: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function disconnectMonday(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/monday/disconnect`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
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
