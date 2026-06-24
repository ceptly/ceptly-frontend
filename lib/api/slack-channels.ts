import { apiFetch, type ApiResult } from "./client";

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export function listSlackChannels(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ channels: SlackChannel[] }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/slack/channels`, {
    token: accessToken,
  });
}
