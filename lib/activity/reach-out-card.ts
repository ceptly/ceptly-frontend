import type { ActivityAdhocSession } from "@/lib/api/types";

export const REACH_OUTS_PER_PAGE = 3;

export function reachOutTitle(session: ActivityAdhocSession): string {
  const name = session.conversation_name?.trim();
  if (name) {
    return name;
  }
  if (session.topic?.trim()) {
    return session.topic.trim();
  }
  return session.intent_label;
}

export function reachOutPromptPreview(session: ActivityAdhocSession): string | null {
  const prompt = session.agent_prompt?.trim();
  if (prompt) {
    return prompt;
  }
  const facts = session.delivery_facts?.trim();
  if (facts) {
    return facts;
  }
  return null;
}

export function formatReachOutDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function reachOutStatusLabel(
  status: ActivityAdhocSession["status"],
): string {
  return status.replace("_", " ");
}

export type ReachOutStatusVariant = "complete" | "secondary" | "outline";

export function reachOutStatusVariant(
  status: ActivityAdhocSession["status"],
): ReachOutStatusVariant {
  if (status === "completed") {
    return "complete";
  }
  if (status === "in_progress") {
    return "secondary";
  }
  return "outline";
}
