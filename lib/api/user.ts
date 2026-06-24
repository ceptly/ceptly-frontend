import { AUTH_ENDPOINTS } from "./auth";
import { apiFetch, type ApiResult } from "./client";
import type { AuthUser } from "./types";

export function patchUserProfile(
  accessToken: string,
  fullName: string,
): Promise<ApiResult<{ user: AuthUser }>> {
  return apiFetch(AUTH_ENDPOINTS.me, {
    token: accessToken,
    method: "PATCH",
    body: { fullName },
  });
}
