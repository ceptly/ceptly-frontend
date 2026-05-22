"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { patchWorkspaceName } from "@/lib/api/workspace";
import { getAccessToken, setWorkspaceNameCookie } from "@/lib/auth/server";

const workspaceNameSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export type WorkspaceNameFormState = {
  errors?: {
    name?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function updateWorkspaceName(
  _state: WorkspaceNameFormState,
  formData: FormData,
): Promise<WorkspaceNameFormState> {
  const parsed = workspaceNameSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in to update the workspace."] } };
  }

  const result = await patchWorkspaceName(
    token,
    parsed.data.workspaceId,
    parsed.data.name,
  );

  if (!result.success) {
    return {
      errors: {
        _form: [result.error ?? "Failed to update workspace name."],
      },
    };
  }

  const workspace = result.data?.workspace;
  if (workspace?.name) {
    await setWorkspaceNameCookie(workspace.name);
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");

  return { success: true };
}
