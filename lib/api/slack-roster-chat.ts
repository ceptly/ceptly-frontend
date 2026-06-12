import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export async function updateSlackRosterChatEnabled(
  accessToken: string,
  workspaceId: string,
  rosterChatEnabled: boolean,
): Promise<{
  success: boolean;
  error?: string;
  data?: { roster_chat_enabled: boolean };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/slack/roster-chat`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roster_chat_enabled: rosterChatEnabled }),
      },
    );

    return parseJsonResponse<{ data?: { roster_chat_enabled: boolean } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
