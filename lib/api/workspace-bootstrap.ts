import { resolveApiBaseUrl } from "./auth";
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

export async function getWorkspaceBootstrap(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { bootstrap: WorkspaceBootstrap };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/bootstrap`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        success: false,
        error: `Unexpected response (HTTP ${response.status}).`,
      };
    }

    return (await response.json()) as {
      success: boolean;
      error?: string;
      data?: { bootstrap: WorkspaceBootstrap };
    };
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
