import { apiFetch, type ApiResult } from "./client";

export function patchWorkspaceName(
  accessToken: string,
  workspaceId: string,
  name: string,
): Promise<
  ApiResult<{ workspace: { id: string; name: string; role: string } }>
> {
  return apiFetch(`/api/workspaces/${workspaceId}`, {
    token: accessToken,
    method: "PATCH",
    body: { name },
  });
}
