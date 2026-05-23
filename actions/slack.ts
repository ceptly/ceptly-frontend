"use server";

import { getSlackInstallUrl } from "@/lib/api/slack";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchSlackInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Slack." };
  }

  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/settings";
  const result = await getSlackInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Slack install URL." };
  }

  return { url: result.data.url };
}
