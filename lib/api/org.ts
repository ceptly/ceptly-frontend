import { resolveApiBaseUrl } from "./auth";

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
}
export interface OrgStructure {
  tree: OrgCompanyNode;
  pool: OrgPoolMember[];
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

async function parseJsonResponse<T>(
  response: Response,
): Promise<T & { success: boolean; error?: string }> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {
      success: false,
      error: `Unexpected response (HTTP ${response.status}).`,
    } as T & { success: boolean; error?: string };
  }
  return (await response.json()) as T & { success: boolean; error?: string };
}

export async function getOrgStructure(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: OrgStructure }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}/org`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return parseJsonResponse<{ data?: OrgStructure }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function saveOrgStructure(
  accessToken: string,
  workspaceId: string,
  tree: { name?: string; groups: OrgGroupInput[] },
): Promise<{ success: boolean; error?: string; data?: OrgStructure }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(`${base}/api/workspaces/${workspaceId}/org`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tree }),
    });
    return parseJsonResponse<{ data?: OrgStructure }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function rescanOrg(
  accessToken: string,
  workspaceId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { pool: OrgPoolMember[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/org/rescan`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return parseJsonResponse<{ data?: { pool: OrgPoolMember[] } }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
