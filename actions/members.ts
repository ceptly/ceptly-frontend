"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  removeWorkspaceMember,
  transferWorkspaceOwnership,
  updateWorkspaceMemberRole,
} from "@/lib/api/members";
import { getAccessToken } from "@/lib/auth/server";

const roleSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

const removeSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

const transferSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function updateMemberRoleAction(
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
): Promise<{ error?: string; success?: boolean }> {
  const parsed = roleSchema.safeParse({ workspaceId, userId, role });
  if (!parsed.success) {
    return { error: "Invalid role update." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage members." };
  }

  const result = await updateWorkspaceMemberRole(
    token,
    parsed.data.workspaceId,
    parsed.data.userId,
    parsed.data.role,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update member role." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function transferOwnershipAction(
  workspaceId: string,
  userId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = transferSchema.safeParse({ workspaceId, userId });
  if (!parsed.success) {
    return { error: "Invalid member." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to transfer ownership." };
  }

  const result = await transferWorkspaceOwnership(
    token,
    parsed.data.workspaceId,
    parsed.data.userId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to transfer ownership." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = removeSchema.safeParse({ workspaceId, userId });
  if (!parsed.success) {
    return { error: "Invalid member." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to manage members." };
  }

  const result = await removeWorkspaceMember(
    token,
    parsed.data.workspaceId,
    parsed.data.userId,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to remove member." };
  }

  revalidatePath("/settings");
  return { success: true };
}
