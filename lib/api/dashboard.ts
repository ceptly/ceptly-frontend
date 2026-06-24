import { apiFetch, type ApiResult } from "./client";
import type { DashboardData, DashboardRangeDays } from "./types";

export function getDashboard(
  accessToken: string,
  workspaceId: string,
  days: DashboardRangeDays,
): Promise<ApiResult<{ dashboard: DashboardData }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/dashboard?days=${days}`, {
    token: accessToken,
  });
}
