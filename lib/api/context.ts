import { resolveApiBaseUrl } from "./auth";
import { parseJsonResponse } from "./http";

export type ContextFactGroup =
  | "people_ownership"
  | "priorities_goals"
  | "product_customers"
  | "team_workings";

export type ContextFactStatus = "live" | "pending" | "dismissed";

export interface ContextFactSource {
  kind: "slack" | "doc" | "note" | "user" | "checkin";
  label: string;
  date: string;
}

export interface ContextFactEvidence {
  type: "chat" | "doc" | "note";
  quote?: string;
  speaker?: string;
  snippet?: string;
  note?: string;
  slackChannelId?: string;
  slackTs?: string;
  permalink?: string;
}

export interface ContextFact {
  id: string;
  group: ContextFactGroup;
  text: string;
  status: ContextFactStatus;
  confidence: number;
  source: ContextFactSource;
  evidence: ContextFactEvidence;
  uncertainty_note: string | null;
  edited: boolean;
  created_at: string;
}

export type ContextSourceKind = "file" | "website" | "kb" | "text";

export interface ContextSource {
  id: string;
  kind: ContextSourceKind;
  name: string;
  status: "indexing" | "ready" | "error";
  facts_count: number;
  error_message: string | null;
  indexed_at: string | null;
  created_at: string;
}

export interface ContextScan {
  id: string;
  status: "running" | "completed" | "failed";
  channels_total: number;
  channels_scanned: number;
  current_channel: string | null;
  findings_count: number;
  facts_count: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ContextScanState {
  active: ContextScan | null;
  last_completed_at: string | null;
}

export interface ContextSnapshot {
  facts: ContextFact[];
  findings: ContextFact[];
  sources: ContextSource[];
  scan: ContextScanState;
}

export type ContextTracker = "jira" | "linear" | "monday";

export interface ContextProject {
  key: string;
  name: string;
  owner: string | null;
  status: "on_track" | "at_risk";
  done: number | null;
  total: number | null;
  progress_pct: number | null;
}

export interface ContextProjects {
  tracker: ContextTracker | null;
  synced_at: string | null;
  projects: ContextProject[];
}

export interface ApiResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

const NETWORK_ERROR = "Could not reach the API. Is the backend running?";

async function contextFetch<T>(
  accessToken: string,
  workspaceId: string,
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/context${path}`,
      {
        cache: "no-store",
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        },
      },
    );
    return parseJsonResponse<{ data?: T }>(response) as Promise<ApiResult<T>>;
  } catch {
    return { success: false, error: NETWORK_ERROR };
  }
}

export function getContextSnapshot(accessToken: string, workspaceId: string) {
  return contextFetch<ContextSnapshot>(accessToken, workspaceId, "");
}

export function addContextFact(
  accessToken: string,
  workspaceId: string,
  group: ContextFactGroup,
  text: string,
) {
  return contextFetch<{ fact: ContextFact }>(accessToken, workspaceId, "/facts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group, text }),
  });
}

export function updateContextFact(
  accessToken: string,
  workspaceId: string,
  factId: string,
  text: string,
) {
  return contextFetch<{ fact: ContextFact }>(
    accessToken,
    workspaceId,
    `/facts/${factId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );
}

export function removeContextFact(
  accessToken: string,
  workspaceId: string,
  factId: string,
) {
  return contextFetch<{ removed: boolean }>(
    accessToken,
    workspaceId,
    `/facts/${factId}`,
    { method: "DELETE" },
  );
}

export function confirmContextFinding(
  accessToken: string,
  workspaceId: string,
  factId: string,
  text?: string,
) {
  return contextFetch<{ fact: ContextFact }>(
    accessToken,
    workspaceId,
    `/facts/${factId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(text ? { text } : {}),
    },
  );
}

export function dismissContextFinding(
  accessToken: string,
  workspaceId: string,
  factId: string,
) {
  return contextFetch<{ dismissed: boolean }>(
    accessToken,
    workspaceId,
    `/facts/${factId}/dismiss`,
    { method: "POST" },
  );
}

export function startContextScan(accessToken: string, workspaceId: string) {
  return contextFetch<{ scan: ContextScan }>(accessToken, workspaceId, "/scan", {
    method: "POST",
  });
}

export function getContextScan(accessToken: string, workspaceId: string) {
  return contextFetch<{ scan: ContextScanState }>(
    accessToken,
    workspaceId,
    "/scan",
  );
}

export function listContextSources(accessToken: string, workspaceId: string) {
  return contextFetch<{ sources: ContextSource[] }>(
    accessToken,
    workspaceId,
    "/sources",
  );
}

export function addContextTextSource(
  accessToken: string,
  workspaceId: string,
  name: string,
  text: string,
) {
  return contextFetch<{ source: ContextSource }>(
    accessToken,
    workspaceId,
    "/sources/text",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text }),
    },
  );
}

export function uploadContextSource(
  accessToken: string,
  workspaceId: string,
  formData: FormData,
) {
  // No Content-Type header — fetch sets the multipart boundary itself.
  return contextFetch<{ source: ContextSource }>(
    accessToken,
    workspaceId,
    "/sources/upload",
    { method: "POST", body: formData },
  );
}

export function reindexContextSource(
  accessToken: string,
  workspaceId: string,
  sourceId: string,
) {
  return contextFetch<{ source: ContextSource }>(
    accessToken,
    workspaceId,
    `/sources/${sourceId}/reindex`,
    { method: "POST" },
  );
}

export function removeContextSource(
  accessToken: string,
  workspaceId: string,
  sourceId: string,
) {
  return contextFetch<{ removed: boolean }>(
    accessToken,
    workspaceId,
    `/sources/${sourceId}`,
    { method: "DELETE" },
  );
}

export function getContextProjects(
  accessToken: string,
  workspaceId: string,
  options: { refresh?: boolean } = {},
) {
  return contextFetch<{ projects: ContextProjects }>(
    accessToken,
    workspaceId,
    `/projects${options.refresh ? "?refresh=1" : ""}`,
  );
}
