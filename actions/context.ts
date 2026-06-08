"use server";

import { revalidatePath } from "next/cache";

import {
  saveCompanyContextSection,
  type CompanyContextField,
} from "@/lib/api/context";
import { getAccessToken } from "@/lib/auth/server";

export async function saveContextSectionAction(
  workspaceId: string,
  category: string,
  fields: CompanyContextField[],
): Promise<{ error?: string; success?: boolean }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in to edit company context." };
  }

  const result = await saveCompanyContextSection(
    token,
    workspaceId,
    category,
    fields,
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to save context." };
  }

  revalidatePath("/context");
  return { success: true };
}
