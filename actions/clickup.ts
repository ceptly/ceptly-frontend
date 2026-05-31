"use server";

import { revalidatePath } from "next/cache";

import {
  disconnectClickUp,
  getClickUpInstallUrl,
} from "@/lib/api/clickup";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchClickUpInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect ClickUp." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/clickup";
  const result = await getClickUpInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get ClickUp install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectClickUpConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect ClickUp." };
  }

  const result = await disconnectClickUp(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect ClickUp." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/clickup");
  revalidatePath("/settings");
  revalidatePath("/chat");
  revalidatePath("/team");

  return { success: true };
}
