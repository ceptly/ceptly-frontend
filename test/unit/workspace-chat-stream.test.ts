import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  ChatStreamEvent,
} from "@/lib/api/workspace-chat-stream";
import {
  createInitialActivity,
  formatToolLabel,
  streamChatWorkspace,
} from "@/lib/api/workspace-chat-stream";

/** Build an SSE response body from a list of stream events. */
function sseResponse(events: ChatStreamEvent[], init?: ResponseInit): Response {
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n`).join("") + "\n";
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatToolLabel", () => {
  it("uses friendly labels for known Ceptly tools", () => {
    expect(formatToolLabel("ceptly", "match_roster_members")).toBe(
      "Matching roster members",
    );
    expect(formatToolLabel("ceptly", "update_agent_form")).toBe(
      "Filling out the agent form",
    );
  });

  it("title-cases unknown tool names with the integration prefix", () => {
    expect(formatToolLabel("linear", "search_issues")).toBe(
      "Linear Search Issues",
    );
    expect(formatToolLabel("jira", "list_projects")).toBe("Jira List Projects");
  });
});

describe("createInitialActivity", () => {
  it("starts thinking with no tools yet", () => {
    const activity = createInitialActivity();
    expect(activity.tools).toEqual([]);
    expect(activity.statusLabel).toMatch(/thinking/i);
    expect(activity.completedAt).toBeUndefined();
  });
});

describe("streamChatWorkspace", () => {
  it("parses an SSE stream and returns the done result incl. the agent_form UI", async () => {
    const events: ChatStreamEvent[] = [
      { type: "status", label: "Thinking about your request" },
      {
        type: "tool_start",
        id: "t1",
        integration: "ceptly",
        name: "update_agent_form",
      },
      { type: "tool_end", id: "t1", status: "success" },
      {
        type: "done",
        assistant_message: "I set up your standup agent.",
        agent: "meeting_creator",
        ui_component: { type: "agent_form", values: { destination: "channel" } },
        session_id: "sess_1",
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(events));
    vi.stubGlobal("fetch", fetchMock);

    const seen: ChatStreamEvent["type"][] = [];
    const result = await streamChatWorkspace(
      "ws_1",
      [{ role: "user", content: "  set up a standup  " }],
      "meeting_creator",
      { onEvent: (e) => seen.push(e.type) },
    );

    // The done result carries the inline agent form.
    expect(result.result?.assistant_message).toBe("I set up your standup agent.");
    expect(result.result?.ui_component).toEqual({
      type: "agent_form",
      values: { destination: "channel" },
    });
    expect(result.result?.session_id).toBe("sess_1");
    expect(seen).toContain("status");
    expect(seen).toContain("done");

    // Request body normalized the message (trimmed) before sending.
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages).toEqual([{ role: "user", content: "set up a standup" }]);
    expect(body.agent).toBe("meeting_creator");
  });

  it("surfaces an error event as an error result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([{ type: "error", message: "model unavailable" }]),
      ),
    );

    const result = await streamChatWorkspace("ws_1", [{ role: "user", content: "hi" }], undefined, {});
    expect(result.error).toBe("model unavailable");
    expect(result.result).toBeUndefined();
  });

  it("returns retryAfterSeconds on a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Too many requests", retry_after_seconds: 30 }),
          { status: 429, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const result = await streamChatWorkspace("ws_1", [{ role: "user", content: "hi" }], undefined, {});
    expect(result.error).toMatch(/too many requests/i);
    expect(result.retryAfterSeconds).toBe(30);
  });
});
