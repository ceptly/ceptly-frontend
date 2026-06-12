import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export interface RosterMember {
  id: string;
  email: string;
  slack_user_id: string | null;
  display_name: string;
  paused: boolean;
  created_at: string;
  data_sources: ("slack" | "linear" | "jira" | "monday" | "teams")[];
  timezone: string | null;
  language: string | null;
  effective_timezone: string;
  effective_language: string;
}

export interface RosterImportResult {
  added: number;
  skipped: number;
  failed: number;
}

export async function listRosterMembers(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { members: RosterMember[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    return parseJsonResponse<{ data?: { members: RosterMember[] } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function addRosterMember(
  accessToken: string,
  workspaceId: string,
  email: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { member: RosterMember };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    return parseJsonResponse<{ data?: { member: RosterMember } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateRosterMember(
  accessToken: string,
  workspaceId: string,
  memberId: string,
  payload: {
    display_name?: string;
    paused?: boolean;
    timezone?: string | null;
    language?: string | null;
  },
): Promise<{
  success: boolean;
  error?: string;
  data?: { member: RosterMember };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/${memberId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    return parseJsonResponse<{ data?: { member: RosterMember } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function importRosterFromSlack(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: RosterImportResult;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/import/slack`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return parseJsonResponse<{ data?: RosterImportResult }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function importRosterFromLinear(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: RosterImportResult;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/import/linear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return parseJsonResponse<{ data?: RosterImportResult }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function importRosterFromJira(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: RosterImportResult;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/import/jira`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return parseJsonResponse<{ data?: RosterImportResult }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function importRosterFromMonday(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: RosterImportResult;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/import/monday`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return parseJsonResponse<{ data?: RosterImportResult }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function importRosterFromTeams(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: RosterImportResult;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/import/teams`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return parseJsonResponse<{ data?: RosterImportResult }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function deleteRosterMember(
  accessToken: string,
  workspaceId: string,
  memberId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/roster/${memberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
