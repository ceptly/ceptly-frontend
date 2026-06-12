import { AUTH_ENDPOINTS, resolveApiBaseUrl } from "./auth";
import type { AuthUser } from "./types";
import { parseJsonResponse } from "./http";

export async function patchUserProfile(
  accessToken: string,
  fullName: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { user: AuthUser };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}${AUTH_ENDPOINTS.me}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName }),
    });

    return parseJsonResponse<{ data?: { user: AuthUser } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
