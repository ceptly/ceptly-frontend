import { apiFetch, type ApiResult } from "./client";
import type { InvitePreview, WorkspaceInvite } from "./types";

export function listInvites(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ invites: WorkspaceInvite[] }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/invites`, {
    token: accessToken,
  });
}

export function createInvite(
  accessToken: string,
  workspaceId: string,
  email: string,
): Promise<
  ApiResult<{ invite: WorkspaceInvite }> & {
    code?: string;
    seatUsage?: number;
    paidSeats?: number;
  }
> {
  // The seat-limit response carries extra top-level fields alongside the
  // standard envelope; apiFetch only types `data`, so widen the result here.
  // TODO: fold code/seatUsage/paidSeats into `data` on the backend so this
  // cast can be dropped (the only non-standard envelope in lib/api).
  return apiFetch<{ invite: WorkspaceInvite }>(
    `/api/workspaces/${workspaceId}/invites`,
    { token: accessToken, method: "POST", body: { email } },
  ) as Promise<
    ApiResult<{ invite: WorkspaceInvite }> & {
      code?: string;
      seatUsage?: number;
      paidSeats?: number;
    }
  >;
}

export function revokeInvite(
  accessToken: string,
  workspaceId: string,
  inviteId: string,
): Promise<ApiResult<never>> {
  return apiFetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, {
    token: accessToken,
    method: "DELETE",
  });
}

export function fetchInvitePreview(
  token: string,
): Promise<ApiResult<{ preview: InvitePreview }>> {
  return apiFetch(`/api/invites/${token}`);
}

export function acceptInvite(
  accessToken: string,
  token: string,
): Promise<
  ApiResult<{ workspace: { id: string; name: string; role: string } }>
> {
  return apiFetch(`/api/invites/${token}/accept`, {
    token: accessToken,
    method: "POST",
  });
}
