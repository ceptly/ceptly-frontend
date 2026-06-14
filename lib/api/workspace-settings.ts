import { resolveApiBaseUrl } from "./auth";
import type { AppContextOption } from "./types";
import { parseJsonResponse } from "./http";

function authHeaders(accessToken: string, json = false): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function listAppContextOptions(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { app_contexts: AppContextOption[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/app-contexts`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { app_contexts: AppContextOption[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: { timezone: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/timezone`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { timezone: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function patchWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
  timezone: string,
): Promise<{ success: boolean; error?: string; data?: { timezone: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/timezone`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ timezone }),
      },
    );
    return parseJsonResponse<{ data?: { timezone: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: { language: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/language`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { language: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function patchWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
  language: string,
): Promise<{ success: boolean; error?: string; data?: { language: string } }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/language`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken, true),
        body: JSON.stringify({ language }),
      },
    );
    return parseJsonResponse<{ data?: { language: string } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
