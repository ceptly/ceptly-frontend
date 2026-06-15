"use server";

import { revalidatePath } from "next/cache";

import {
  dismissActivityAttentionItem as dismissActivityAttentionItemApi,
  getWorkspaceAttentionCount,
} from "@/lib/api/activity";
import { getAccessToken } from "@/lib/auth/server";

export async function dismissActivityAttentionAction(input: {
  workspaceId: string;
  itemType: "roster_tracker_mismatch";
  itemKey: string;
}): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await dismissActivityAttentionItemApi(
    token,
    input.workspaceId,
    {
      item_type: input.itemType,
      item_key: input.itemKey,
    },
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to dismiss alert." };
  }

  revalidatePath("/activity");
  revalidatePath("/team");
  return {};
}

export async function fetchActivityAttentionCount(input: {
  workspaceId: string;
}): Promise<number> {
  const token = await getAccessToken();
  if (!token) {
    return 0;
  }

  const result = await getWorkspaceAttentionCount(token, input.workspaceId);
  return result.data?.attention_count ?? 0;
}
