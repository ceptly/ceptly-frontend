import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function cancelFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/follow-ups/${followUpId}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
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

export async function rescheduleFollowUp(
  accessToken: string,
  workspaceId: string,
  followUpId: string,
  scheduledFor: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/follow-ups/${followUpId}`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduled_for: scheduledFor }),
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
