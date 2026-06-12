import { resolveApiBaseUrl } from "./auth";
import type { ConversationRunDetail, ConversationRunSummary } from "./types";
import { parseJsonResponse } from "./http";

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listConversationRuns(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { runs: ConversationRunSummary[] };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/runs`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { runs: ConversationRunSummary[] } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getLatestConversationRun(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { run: ConversationRunDetail | null };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/runs/latest`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { run: ConversationRunDetail | null } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}

export async function getConversationRun(
  accessToken: string,
  workspaceId: string,
  conversationId: string,
  runId: string,
): Promise<{
  success: boolean;
  error?: string;
  data?: { run: ConversationRunDetail };
}> {
  try {
    const base = await resolveApiBaseUrl();
    const response = await fetch(
      `${base}/api/workspaces/${workspaceId}/conversations/${conversationId}/runs/${runId}`,
      {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      },
    );
    return parseJsonResponse<{ data?: { run: ConversationRunDetail } }>(
      response,
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the API. Is the backend running?",
    };
  }
}
