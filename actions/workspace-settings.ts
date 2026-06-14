"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  patchWorkspaceLanguage,
  patchWorkspaceTimezone,
} from "@/lib/api/workspace-settings";
import { getAccessToken } from "@/lib/auth/server";

export type WorkspaceTimezoneFormState = {
  errors?: { timezone?: string[]; _form?: string[] };
  success?: boolean;
};

export async function updateWorkspaceTimezone(
  _state: WorkspaceTimezoneFormState,
  formData: FormData,
): Promise<WorkspaceTimezoneFormState> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      timezone: z.string().trim().min(1),
    })
    .safeParse({
      workspaceId: formData.get("workspaceId"),
      timezone: formData.get("timezone"),
    });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in."] } };
  }

  const result = await patchWorkspaceTimezone(
    token,
    parsed.data.workspaceId,
    parsed.data.timezone,
  );

  if (!result.success) {
    return {
      errors: { _form: [result.error ?? "Failed to update timezone."] },
    };
  }

  revalidatePath("/settings");
  revalidatePath("/activity");
  revalidatePath("/team");

  return { success: true };
}

export type WorkspaceLanguageFormState = {
  errors?: { language?: string[]; _form?: string[] };
  success?: boolean;
};

export async function updateWorkspaceLanguage(
  _state: WorkspaceLanguageFormState,
  formData: FormData,
): Promise<WorkspaceLanguageFormState> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      language: z.string().trim().min(1),
    })
    .safeParse({
      workspaceId: formData.get("workspaceId"),
      language: formData.get("language"),
    });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in."] } };
  }

  const result = await patchWorkspaceLanguage(
    token,
    parsed.data.workspaceId,
    parsed.data.language,
  );

  if (!result.success) {
    return {
      errors: { _form: [result.error ?? "Failed to update language."] },
    };
  }

  revalidatePath("/settings");
  revalidatePath("/team");

  return { success: true };
}
