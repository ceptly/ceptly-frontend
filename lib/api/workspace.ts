import { resolveApiBaseUrl } from "./auth";

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

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return {
        success: false,
        error: `Could not update workspace (HTTP ${response.status}).`,
      };
    }

    return (await response.json()) as {
      success: boolean;
      error?: string;
      data?: { workspace: { id: string; name: string; role: string } };
    };
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
