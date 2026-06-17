"use server";

import { revalidatePath } from "next/cache";

import {
  cancelFollowUp as cancelFollowUpApi,
  rescheduleFollowUp as rescheduleFollowUpApi,
} from "@/lib/api/follow-ups";
import { getAccessToken } from "@/lib/auth/server";

export async function cancelFollowUpAction(input: {
  workspaceId: string;
  followUpId: string;
}): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await cancelFollowUpApi(
    token,
    input.workspaceId,
    input.followUpId,
  );
  if (!result.success) {
    return { error: result.error ?? "Failed to cancel follow-up." };
  }

  revalidatePath("/activity");
  return {};
}

export async function rescheduleFollowUpAction(input: {
  workspaceId: string;
  followUpId: string;
  scheduledFor: string;
}): Promise<{ error?: string; scheduledFor?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await rescheduleFollowUpApi(
    token,
    input.workspaceId,
    input.followUpId,
    input.scheduledFor,
  );
  if (!result.success) {
    return { error: result.error ?? "Failed to reschedule follow-up." };
  }

  revalidatePath("/activity");
  return { scheduledFor: result.data?.scheduled_for };
}
