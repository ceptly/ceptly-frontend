import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export interface SlackConnectionStatus {
  connected: boolean;
  searchEnabled?: boolean;
  rosterChatEnabled?: boolean;
  teamId?: string | null;
  teamName?: string | null;
  installedAt?: string | null;
}

export async function getSlackConnectionStatus(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: SlackConnectionStatus;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/slack/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: SlackConnectionStatus }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getSlackInstallUrl(
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
      `${base}/api/workspaces/${workspaceId}/slack/install-url?${params.toString()}`,
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

export async function disconnectSlack(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/slack/disconnect`,
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
