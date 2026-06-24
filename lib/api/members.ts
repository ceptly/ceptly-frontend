import { apiFetch, type ApiResult } from "./client";
import type { WorkspaceMember } from "./types";

const membersBase = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}/members`;

export function listWorkspaceMembers(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ members: WorkspaceMember[] }>> {
  return apiFetch(membersBase(workspaceId), { token: accessToken });
}

export function updateWorkspaceMemberRole(
  accessToken: string,
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
): Promise<ApiResult<{ member: WorkspaceMember }>> {
  return apiFetch(`${membersBase(workspaceId)}/${userId}`, {
    token: accessToken,
    method: "PATCH",
    body: { role },
  });
}

export function removeWorkspaceMember(
  accessToken: string,
  workspaceId: string,
  userId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`${membersBase(workspaceId)}/${userId}`, {
    token: accessToken,
    method: "DELETE",
  });
}

export function transferWorkspaceOwnership(
  accessToken: string,
  workspaceId: string,
  userId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`${membersBase(workspaceId)}/${userId}/transfer-ownership`, {
    token: accessToken,
    method: "POST",
  });
}
