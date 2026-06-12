import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function listSlackChannels(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { channels: SlackChannel[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/slack/channels`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { channels: SlackChannel[] } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
