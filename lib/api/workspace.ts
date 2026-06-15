import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export async function patchWorkspaceName(
  accessToken: string,
  workspaceId: string,
  name: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { workspace: { id: string; name: string; role: string } };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    return parseJsonResponse<{
      data?: { workspace: { id: string; name: string; role: string } };
    }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
