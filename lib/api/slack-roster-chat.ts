import { apiFetch, type ApiResult } from "./client";

export function updateSlackRosterChatEnabled(
  accessToken: string,
  workspaceId: string,
  rosterChatEnabled: boolean,
): Promise<ApiResult<{ roster_chat_enabled: boolean }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/slack/roster-chat`, {
    token: accessToken,
    method: "PATCH",
    body: { roster_chat_enabled: rosterChatEnabled },
  });
}
