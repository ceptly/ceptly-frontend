"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  updateClickUpChatWebhookSecret,
  updateCommunicationPlatform,
  type CommunicationPlatform,
  type CommunicationSettings,
} from "@/lib/api/communication";
import { getAccessToken } from "@/lib/auth/server";

const platformSchema = z.object({
  workspaceId: z.string().uuid(),
  platform: z.enum(["slack", "clickup", "teams"]),
});

const webhookSchema = z.object({
  workspaceId: z.string().uuid(),
  webhookSecret: z.string().trim().min(1).max(256).nullable(),
});

export async function updateCommunicationPlatformAction(input: {
  workspaceId: string;
  platform: CommunicationPlatform;
}): Promise<{ error?: string; settings?: CommunicationSettings }> {
  const parsed = platformSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateCommunicationPlatform(
    token,
    parsed.data.workspaceId,
    parsed.data.platform,
  );

  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to update communication platform." };
  }

  revalidatePath("/settings");
  revalidatePath("/settings/standups");
  return { settings: result.data };
}

export async function updateClickUpWebhookSecretAction(input: {
  workspaceId: string;
  webhookSecret: string | null;
}): Promise<{ error?: string; settings?: CommunicationSettings }> {
  const parsed = webhookSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateClickUpChatWebhookSecret(
    token,
    parsed.data.workspaceId,
    parsed.data.webhookSecret,
  );

  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to update webhook secret." };
  }

  revalidatePath("/settings");
  return { settings: result.data };
}
