import { apiFetch, type ApiResult } from "./client";

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

const rosterBase = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}/roster`;

export function listRosterMembers(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ members: RosterMember[] }>> {
  return apiFetch(rosterBase(workspaceId), { token: accessToken });
}

export function addRosterMember(
  accessToken: string,
  workspaceId: string,
  email: string,
): Promise<ApiResult<{ member: RosterMember }>> {
  return apiFetch(rosterBase(workspaceId), {
    token: accessToken,
    method: "POST",
    body: { email },
  });
}

export function updateRosterMember(
  accessToken: string,
  workspaceId: string,
  memberId: string,
  payload: {
    display_name?: string;
    paused?: boolean;
    timezone?: string | null;
    language?: string | null;
  },
): Promise<ApiResult<{ member: RosterMember }>> {
  return apiFetch(`${rosterBase(workspaceId)}/${memberId}`, {
    token: accessToken,
    method: "PATCH",
    body: payload,
  });
}

function importRosterFrom(
  source: "slack" | "linear" | "jira" | "monday" | "teams",
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<RosterImportResult>> {
  return apiFetch(`${rosterBase(workspaceId)}/import/${source}`, {
    token: accessToken,
    method: "POST",
  });
}

export const importRosterFromSlack = (
  accessToken: string,
  workspaceId: string,
) => importRosterFrom("slack", accessToken, workspaceId);

export const importRosterFromLinear = (
  accessToken: string,
  workspaceId: string,
) => importRosterFrom("linear", accessToken, workspaceId);

export const importRosterFromJira = (
  accessToken: string,
  workspaceId: string,
) => importRosterFrom("jira", accessToken, workspaceId);

export const importRosterFromMonday = (
  accessToken: string,
  workspaceId: string,
) => importRosterFrom("monday", accessToken, workspaceId);

export const importRosterFromTeams = (
  accessToken: string,
  workspaceId: string,
) => importRosterFrom("teams", accessToken, workspaceId);

export function deleteRosterMember(
  accessToken: string,
  workspaceId: string,
  memberId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`${rosterBase(workspaceId)}/${memberId}`, {
    token: accessToken,
    method: "DELETE",
  });
}
