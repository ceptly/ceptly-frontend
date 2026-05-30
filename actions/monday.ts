"use server";

import { revalidatePath } from "next/cache";

import { disconnectMonday, getMondayInstallUrl } from "@/lib/api/monday";
import { getAccessToken } from "@/lib/auth/server";

export async function fetchMondayInstallUrl(
  workspaceId: string,
  returnTo: string,
): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to connect Monday.com." };
  }

  const safeReturnTo = returnTo.startsWith("/")
    ? returnTo
    : "/settings/integrations/monday";
  const result = await getMondayInstallUrl(token, workspaceId, safeReturnTo);

  if (!result.success || !result.data?.url) {
    return { error: result.error ?? "Failed to get Monday.com install URL." };
  }

  return { url: result.data.url };
}

export async function disconnectMondayConnection(
  workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to disconnect Monday.com." };
  }

  const result = await disconnectMonday(token, workspaceId);

  if (!result.success) {
    return { error: result.error ?? "Failed to disconnect Monday.com." };
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/settings/integrations/monday");
  revalidatePath("/settings");
  revalidatePath("/chat");

  return { success: true };
}
