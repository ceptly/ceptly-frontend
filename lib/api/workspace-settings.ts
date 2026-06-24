import { apiFetch, type ApiResult } from "./client";
import type { AppContextOption } from "./types";

export function listAppContextOptions(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ app_contexts: AppContextOption[] }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/conversations/app-contexts`, {
    token: accessToken,
  });
}

export function getWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ timezone: string }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/timezone`, {
    token: accessToken,
  });
}

export function patchWorkspaceTimezone(
  accessToken: string,
  workspaceId: string,
  timezone: string,
): Promise<ApiResult<{ timezone: string }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/timezone`, {
    token: accessToken,
    method: "PATCH",
    body: { timezone },
  });
}

export function getWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ language: string }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/language`, {
    token: accessToken,
  });
}

export function patchWorkspaceLanguage(
  accessToken: string,
  workspaceId: string,
  language: string,
): Promise<ApiResult<{ language: string }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/language`, {
    token: accessToken,
    method: "PATCH",
    body: { language },
  });
}
