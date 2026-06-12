import { resolveApiBaseUrl } from "./auth";
import type { DashboardData, DashboardRangeDays } from "./types";
import { parseJsonResponse } from "./http";

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
    return parseJsonResponse<{ data?: { dashboard: DashboardData } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
