import { apiFetch, type ApiResult } from "./client";
import type { RosterMember } from "./roster";

export interface WorkspaceBootstrap {
  roster: RosterMember[];
  timezone: string;
  language: string;
  communication_platform?: "slack" | "teams";
  integrations: {
    slack: boolean;
    linear: boolean;
    jira: boolean;
    monday: boolean;
    teams: boolean;
  };
}

export function getWorkspaceBootstrap(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ bootstrap: WorkspaceBootstrap }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/bootstrap`, {
    token: accessToken,
  });
}
