import { resolveApiBaseUrl } from "./auth";
import type { WorkspaceActivity } from "./types";
import { parseJsonResponse } from "./http";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getWorkspaceActivity(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { activity: WorkspaceActivity };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/activity`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { activity: WorkspaceActivity } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getWorkspaceAttentionCount(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { attention_count: number };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/activity/attention-count`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { attention_count: number } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function dismissActivityAttentionItem(
  accessToken: string,
  workspaceId: string,
  input: {
    item_type: "roster_tracker_mismatch";
    item_key: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/activity/dismiss`,
      {
        method: "POST",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
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
