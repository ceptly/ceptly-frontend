"use server";

import { revalidatePath } from "next/cache";

import {
  addContextFact,
  addContextTextSource,
  confirmContextFinding,
  dismissContextFinding,
  getContextProjects,
  getContextScan,
  getContextSnapshot,
  reindexContextSource,
  removeContextFact,
  removeContextSource,
  startContextScan,
  updateContextFact,
  uploadContextSource,
  type ContextFact,
  type ContextFactGroup,
  type ContextProjects,
  type ContextScan,
  type ContextScanState,
  type ContextSnapshot,
  type ContextSource,
} from "@/lib/api/context";
import { getAccessToken } from "@/lib/auth/server";

interface ActionResult<T = undefined> {
  success?: boolean;
  error?: string;
  data?: T;
}

const SIGN_IN_ERROR = "You must be signed in to manage company context.";

async function withToken<T>(
  fn: (token: string) => Promise<{ success: boolean; error?: string; data?: T }>,
  fallbackError: string,
  revalidate = true,
): Promise<ActionResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { error: SIGN_IN_ERROR };
  }
  const result = await fn(token);
  if (!result.success) {
    return { error: result.error ?? fallbackError };
  }
  if (revalidate) {
    revalidatePath("/context");
  }
  return { success: true, data: result.data };
}

export async function getContextSnapshotAction(
  workspaceId: string,
): Promise<ActionResult<ContextSnapshot>> {
  return withToken(
    (token) => getContextSnapshot(token, workspaceId),
    "Failed to load company context.",
    false,
  );
}

export async function addFactAction(
  workspaceId: string,
  group: ContextFactGroup,
  text: string,
): Promise<ActionResult<{ fact: ContextFact }>> {
  return withToken(
    (token) => addContextFact(token, workspaceId, group, text),
    "Failed to add fact.",
  );
}

export async function updateFactAction(
  workspaceId: string,
  factId: string,
  text: string,
): Promise<ActionResult<{ fact: ContextFact }>> {
  return withToken(
    (token) => updateContextFact(token, workspaceId, factId, text),
    "Failed to update fact.",
  );
}

export async function removeFactAction(
  workspaceId: string,
  factId: string,
): Promise<ActionResult<{ removed: boolean }>> {
  return withToken(
    (token) => removeContextFact(token, workspaceId, factId),
    "Failed to remove fact.",
  );
}

export async function confirmFindingAction(
  workspaceId: string,
  factId: string,
  text?: string,
): Promise<ActionResult<{ fact: ContextFact }>> {
  return withToken(
    (token) => confirmContextFinding(token, workspaceId, factId, text),
    "Failed to confirm finding.",
  );
}

export async function dismissFindingAction(
  workspaceId: string,
  factId: string,
): Promise<ActionResult<{ dismissed: boolean }>> {
  return withToken(
    (token) => dismissContextFinding(token, workspaceId, factId),
    "Failed to dismiss finding.",
  );
}

export async function startScanAction(
  workspaceId: string,
): Promise<ActionResult<{ scan: ContextScan }>> {
  return withToken(
    (token) => startContextScan(token, workspaceId),
    "Failed to start the Slack scan.",
    false,
  );
}

export async function getScanStatusAction(
  workspaceId: string,
): Promise<ActionResult<{ scan: ContextScanState }>> {
  return withToken(
    (token) => getContextScan(token, workspaceId),
    "Failed to check the scan.",
    false,
  );
}

export async function addTextSourceAction(
  workspaceId: string,
  name: string,
  text: string,
): Promise<ActionResult<{ source: ContextSource }>> {
  return withToken(
    (token) => addContextTextSource(token, workspaceId, name, text),
    "Failed to add the source.",
  );
}

export async function uploadSourceAction(
  workspaceId: string,
  formData: FormData,
): Promise<ActionResult<{ source: ContextSource }>> {
  return withToken(
    (token) => uploadContextSource(token, workspaceId, formData),
    "Failed to upload the file.",
  );
}

export async function reindexSourceAction(
  workspaceId: string,
  sourceId: string,
): Promise<ActionResult<{ source: ContextSource }>> {
  return withToken(
    (token) => reindexContextSource(token, workspaceId, sourceId),
    "Failed to re-index the source.",
  );
}

export async function removeSourceAction(
  workspaceId: string,
  sourceId: string,
): Promise<ActionResult<{ removed: boolean }>> {
  return withToken(
    (token) => removeContextSource(token, workspaceId, sourceId),
    "Failed to remove the source.",
  );
}

export async function resyncProjectsAction(
  workspaceId: string,
): Promise<ActionResult<{ projects: ContextProjects }>> {
  return withToken(
    (token) => getContextProjects(token, workspaceId, { refresh: true }),
    "Failed to re-sync projects.",
    false,
  );
}
