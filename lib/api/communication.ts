import { resolveApiBaseUrl } from "./auth";

export type CommunicationPlatform = "slack" | "clickup" | "teams";

export interface CommunicationSettings {
  communication_platform: CommunicationPlatform;
  slack_connected: boolean;
  clickup_connected: boolean;
  teams_connected: boolean;
  roster_chat_enabled: boolean;
  digest_channel_id: string | null;
  clickup_chat_webhook_secret_set: boolean;
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

interface ApiEnvelope<T> {
  success: boolean;
  error?: string;
  data?: T;
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function parseJsonResponse<T>(
  response: Response,
): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    };
  }
  return (await response.json()) as ApiEnvelope<T>;
}

export async function getCommunicationSettings(
  accessToken: string,
  workspaceId: string,
): Promise<ApiEnvelope<CommunicationSettings>> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/communication`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<CommunicationSettings>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateCommunicationPlatform(
  accessToken: string,
  workspaceId: string,
  platform: CommunicationPlatform,
): Promise<ApiEnvelope<CommunicationSettings>> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/communication`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ communication_platform: platform }),
      },
    );
    return parseJsonResponse<CommunicationSettings>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function updateClickUpChatWebhookSecret(
  accessToken: string,
  workspaceId: string,
  webhookSecret: string | null,
): Promise<ApiEnvelope<CommunicationSettings>> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/communication/clickup-webhook-secret`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhook_secret: webhookSecret }),
      },
    );
    return parseJsonResponse<CommunicationSettings>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function listChatChannels(
  accessToken: string,
  workspaceId: string,
): Promise<ApiEnvelope<ChatChannelsPayload>> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/chat/channels`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<ChatChannelsPayload>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
