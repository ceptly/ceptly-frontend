import { apiFetch, type ApiResult } from "./client";

export type CommunicationPlatform = "slack" | "teams";

export interface CommunicationSettings {
  communication_platform: CommunicationPlatform;
  slack_connected: boolean;
  teams_connected: boolean;
  roster_chat_enabled: boolean;
  digest_channel_id: string | null;
}

export interface ChatChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export interface ChatChannelsPayload {
  platform: CommunicationPlatform;
  channels: ChatChannel[];
}

export function getCommunicationSettings(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<CommunicationSettings>> {
  return apiFetch(`/api/workspaces/${workspaceId}/communication`, {
    token: accessToken,
  });
}

export function updateCommunicationPlatform(
  accessToken: string,
  workspaceId: string,
  platform: CommunicationPlatform,
): Promise<ApiResult<CommunicationSettings>> {
  return apiFetch(`/api/workspaces/${workspaceId}/communication`, {
    token: accessToken,
    method: "PATCH",
    body: { communication_platform: platform },
  });
}

export function listChatChannels(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<ChatChannelsPayload>> {
  return apiFetch(`/api/workspaces/${workspaceId}/chat/channels`, {
    token: accessToken,
  });
}
