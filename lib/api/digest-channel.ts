import { apiFetch, type ApiResult } from "./client";

type DigestChannel = { digest_slack_channel_id: string | null };

const digestChannelPath = (workspaceId: string) =>
  `/api/workspaces/${workspaceId}/digest-channel`;

export function getDigestSlackChannel(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<DigestChannel>> {
  return apiFetch(digestChannelPath(workspaceId), { token: accessToken });
}

export function updateDigestSlackChannel(
  accessToken: string,
  workspaceId: string,
  digestSlackChannelId: string | null,
): Promise<ApiResult<DigestChannel>> {
  return apiFetch(digestChannelPath(workspaceId), {
    token: accessToken,
    method: "PATCH",
    body: { digest_slack_channel_id: digestSlackChannelId },
  });
}
