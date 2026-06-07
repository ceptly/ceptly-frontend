import { resolveApiBaseUrl } from "./auth";

export type CompanyContextFieldType = "text" | "textarea" | "tags";

export interface CompanyContextField {
  key: string;
  label: string;
  type: CompanyContextFieldType;
  value: string | string[];
}

export interface CompanyContextSection {
  category: string;
  fields: CompanyContextField[];
  completeness: number;
  updated_at: string | null;
}

export interface CompanyContext {
  sections: CompanyContextSection[];
  overall: number;
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

export async function getCompanyContext(
  accessToken: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string; data?: CompanyContext }> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/context`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: CompanyContext }>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function saveCompanyContextSection(
  accessToken: string,
  workspaceId: string,
  category: string,
  fields: CompanyContextField[],
): Promise<{
  success: boolean;
  error?: string;
  data?: { section: CompanyContextSection };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/context/${category}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      },
    );
    return parseJsonResponse<{ data?: { section: CompanyContextSection } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
