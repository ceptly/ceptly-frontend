import { resolveApiBaseUrl } from "./auth";
import type { SetupChatMessage, SetupChatUiComponent } from "./types";

interface ChatSessionSummary {
  id: string;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryMessageRow {
  role: "user" | "assistant";
  content: string;
  agentId: string | null;
  proposal: { ui_component?: SetupChatUiComponent } | null;
  createdAt: string;
}

export interface ChatHistory {
  sessionId: string | null;
  messages: SetupChatMessage[];
}

async function getJson<T>(
  url: string,
  accessToken: string,
): Promise<(T & { success: boolean }) | null> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const contentType = response.headers.get("content-type");
  if (!response.ok || !contentType?.includes("application/json")) {
    return null;
  }
  return (await response.json()) as T & { success: boolean };
}

/**
 * Load the founder's most recent chat session so the conversation survives a
 * page refresh. Returns an empty history (and a null sessionId) on any failure,
 * so the chat still renders.
 */
export async function loadChatHistory(
  accessToken: string,
  workspaceId: string,
): Promise<ChatHistory> {
  try {
    const base = await resolveApiBaseUrl();
    const sessionsResult = await getJson<{
      data?: { sessions: ChatSessionSummary[] };
    }>(`${base}/api/workspaces/${workspaceId}/chat/sessions`, accessToken);

    const latest = sessionsResult?.data?.sessions?.[0];
    if (!latest) {
      return { sessionId: null, messages: [] };
    }

    const messagesResult = await getJson<{
      data?: { messages: ChatHistoryMessageRow[] };
    }>(
      `${base}/api/workspaces/${workspaceId}/chat/sessions/${latest.id}`,
      accessToken,
    );

    const rows = messagesResult?.data?.messages ?? [];
    const messages: SetupChatMessage[] = rows.map((row) => ({
      role: row.role,
      content: row.content,
      ui_component: row.proposal?.ui_component,
    }));

    return { sessionId: latest.id, messages };
  } catch {
    return { sessionId: null, messages: [] };
  }
}
