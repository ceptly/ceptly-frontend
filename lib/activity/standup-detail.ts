import type { StandupSessionDetail } from "@/lib/api/types";

function isConversationalReply(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length >= 48) {
    return false;
  }
  return /^(yeah|yes|yep|yup|ok|okay|sure|nope|no|clear|thanks|thank you|sounds good|got it|will do)\b/i.test(
    trimmed,
  );
}

function pickSubstantiveMemberMessage(messages: string[]): string | null {
  if (messages.length === 0) {
    return null;
  }
  if (messages.length === 1) {
    return messages[0]?.trim() ?? null;
  }

  const nonReplies = messages
    .map((message) => message.trim())
    .filter((message) => message.length > 0 && !isConversationalReply(message));
  if (nonReplies.length > 0) {
    return [...nonReplies].sort((a, b) => b.length - a.length)[0] ?? null;
  }

  return messages[0]?.trim() ?? null;
}

function extractMemberFindingFromSessionSummary(
  summaryText: string | undefined,
  displayName: string,
): string | null {
  if (!summaryText?.trim()) {
    return null;
  }

  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  for (const name of [displayName, firstName]) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|\\n)[-*\\s]*\\*{0,2}${escaped}\\*{0,2}[:\\-–—]\\s*([^\\n]+)`,
      "i",
    );
    const match = summaryText.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].replace(/\*\*/g, "").trim();
    }
  }

  return null;
}

export function buildStandupResponseRows(detail: StandupSessionDetail) {
  if (detail.member_responses?.length) {
    return detail.member_responses.map((member) => ({
      key: member.roster_member_id,
      name: member.display_name,
      note: member.note ?? null,
      responded: member.responded,
    }));
  }

  const icMessagesByName = new Map<string, string[]>();
  for (const message of detail.messages) {
    if (message.role !== "ic" || !message.display_name) {
      continue;
    }
    const existing = icMessagesByName.get(message.display_name) ?? [];
    existing.push(message.content);
    icMessagesByName.set(message.display_name, existing);
  }

  return detail.participants.map((participant) => {
    const messages = icMessagesByName.get(participant.display_name) ?? [];
    const responded = messages.length > 0;
    const note =
      extractMemberFindingFromSessionSummary(
        detail.summary_text,
        participant.display_name,
      ) ?? pickSubstantiveMemberMessage(messages);

    return {
      key: participant.roster_member_id,
      name: participant.display_name,
      note: responded ? note : null,
      responded,
    };
  });
}
