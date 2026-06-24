import { apiFetch, type ApiResult } from "./client";

export interface OrgGroupNode {
  id: string;
  name: string;
  people: OrgPersonNode[];
}
export interface OrgPersonNode {
  id: string;
  name: string;
  role: string | null;
  rosterMemberId: string | null;
  groups: OrgGroupNode[];
}
export interface OrgCompanyNode {
  id: string;
  kind: "company";
  name: string;
  role: string;
  groups: OrgGroupNode[];
}
export interface OrgPoolMember {
  rosterMemberId: string;
  name: string;
  role: string | null;
  source: string | null;
  /** AI placement hints, populated by a Slack/LLM re-scan. */
  suggestedGroupName?: string | null;
  suggestedManagerName?: string | null;
  reason?: string | null;
}
export interface OrgStructure {
  tree: OrgCompanyNode;
  pool: OrgPoolMember[];
}

// ---- communication graph (who talks to whom) ----------------------------
export interface OrgCommNode {
  rosterMemberId: string;
  name: string;
  placed: boolean;
}
export interface OrgCommEdge {
  source: string;
  target: string;
  weight: number;
  mentionCount: number;
  replyCount: number;
  sharedChannelCount: number;
  lastInteractionAt: string | null;
}
export interface OrgCommunications {
  nodes: OrgCommNode[];
  edges: OrgCommEdge[];
}

/** What the client sends back on save — ids are dropped (server regenerates). */
export interface OrgGroupInput {
  name: string;
  people: OrgPersonInput[];
}
export interface OrgPersonInput {
  name: string;
  role?: string | null;
  rosterMemberId?: string | null;
  groups: OrgGroupInput[];
}

export function getOrgStructure(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<OrgStructure>> {
  return apiFetch(`/api/workspaces/${workspaceId}/org`, {
    token: accessToken,
  });
}

export function saveOrgStructure(
  accessToken: string,
  workspaceId: string,
  tree: { name?: string; groups: OrgGroupInput[] },
): Promise<ApiResult<OrgStructure>> {
  return apiFetch(`/api/workspaces/${workspaceId}/org`, {
    token: accessToken,
    method: "PUT",
    body: { tree },
  });
}

export function getOrgCommunications(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<OrgCommunications>> {
  return apiFetch(`/api/workspaces/${workspaceId}/org/communications`, {
    token: accessToken,
  });
}

export function rescanOrg(
  accessToken: string,
  workspaceId: string,
): Promise<ApiResult<{ pool: OrgPoolMember[] }>> {
  return apiFetch(`/api/workspaces/${workspaceId}/org/rescan`, {
    token: accessToken,
    method: "POST",
  });
}
