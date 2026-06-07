"use server";

import { revalidatePath } from "next/cache";

import {
  rescanOrg,
  saveOrgStructure,
  type OrgGroupInput,
  type OrgPoolMember,
  type OrgStructure,
} from "@/lib/api/org";
import { getAccessToken } from "@/lib/auth/server";

export async function saveOrgStructureAction(
  workspaceId: string,
  tree: { name?: string; groups: OrgGroupInput[] },
): Promise<{ error?: string; success?: boolean; data?: OrgStructure }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to edit the org chart." };
  }

  const result = await saveOrgStructure(token, workspaceId, tree);
  if (!result.success) {
    return { error: result.error ?? "Failed to save org structure." };
  }

  revalidatePath("/team");
  return { success: true, data: result.data };
}

export async function rescanOrgAction(
  workspaceId: string,
): Promise<{ error?: string; success?: boolean; pool?: OrgPoolMember[] }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to scan for teammates." };
  }

  const result = await rescanOrg(token, workspaceId);
  if (!result.success || !result.data) {
    return { error: result.error ?? "Failed to re-scan." };
  }

  return { success: true, pool: result.data.pool };
}
