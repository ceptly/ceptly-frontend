import { resolveApiBaseUrl } from "./auth";
import type { DashboardData, DashboardRangeDays } from "./types";

async function parseJsonResponse<T>(
  response: Response,
): Promise<T & { success: boolean; error?: string }> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    } as T & { success: boolean; error?: string };
  }

  return (await response.json()) as T & { success: boolean; error?: string };
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getDashboard(
  accessToken: string,
  workspaceId: string,
  days: DashboardRangeDays,
): Promise<{
  success: boolean;
  error?: string;
  data?: { dashboard: DashboardData };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/dashboard?days=${days}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { dashboard: DashboardData } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
