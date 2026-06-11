"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  updateCommunicationPlatform,
  type CommunicationPlatform,
  type CommunicationSettings,
} from "@/lib/api/communication";
import { getAccessToken } from "@/lib/auth/server";

const platformSchema = z.object({
  workspaceId: z.string().uuid(),
  platform: z.enum(["slack", "teams"]),
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
