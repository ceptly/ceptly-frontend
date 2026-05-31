"use server";

import { revalidatePath } from "next/cache";

import {
  disconnectTeams,
  getTeamsInstallUrl,
} from "@/lib/api/teams";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchTeamsInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Microsoft Teams." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/teams";
  const result = await getTeamsInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Microsoft Teams install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectTeamsConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect Microsoft Teams." };
  }

  const result = await disconnectTeams(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect Microsoft Teams." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/teams");
  revalidatePath("/settings");
  revalidatePath("/chat");
  revalidatePath("/team");

  return { success: true };
}
