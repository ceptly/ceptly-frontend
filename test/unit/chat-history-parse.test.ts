import { describe, expect, it } from "vitest";

import { parseStoredUiComponent } from "@/lib/chat-history-ui-component";
import { formatChatSessionPreview } from "@/lib/chat-session-preview";

describe("formatChatSessionPreview", () => {
  it("truncates at 80 characters to match backend listChatSessions", () => {
    const long = "a".repeat(100);
    expect(formatChatSessionPreview(long)).toHaveLength(80);
    expect(formatChatSessionPreview("  hello  ")).toBe("hello");
  });
});

describe("parseStoredUiComponent", () => {
  it("returns undefined for malformed values", () => {
    expect(parseStoredUiComponent(null)).toBeUndefined();
    expect(parseStoredUiComponent({ type: "agent_form" })).toBeUndefined();
    expect(parseStoredUiComponent({ type: "unknown" })).toBeUndefined();
  });

  it("parses agent_deployed and agent_form", () => {
    expect(parseStoredUiComponent({ type: "agent_deployed", name: "Standup" })).toEqual({
      type: "agent_deployed",
      name: "Standup",
    });
    expect(
      parseStoredUiComponent({
        type: "agent_form",
        values: { name: "Daily sync" },
      }),
    ).toEqual({
      type: "agent_form",
      values: { name: "Daily sync" },
    });
  });
});
