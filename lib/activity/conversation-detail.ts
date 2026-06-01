import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import type {
  ConversationRunRespondedMember,
  ScheduledConversation,
} from "@/lib/api/types";

export function buildConversationActivitySubtitle(
  conversation: Pick<
    ScheduledConversation,
    | "result_destinations"
    | "template_id"
    | "time_local"
    | "timezone"
    | "frequency"
    | "days_of_week"
    | "enabled"
  >,
): string {
  const slackDestination = conversation.result_destinations?.find(
    (destination) => destination.type === "slack_channel",
  );
  const channelLabel =
    slackDestination?.type === "slack_channel" && slackDestination.name
      ? `#${slackDestination.name}`
      : null;

  const typeLabel =
    conversation.template_id === "daily_standup"
      ? "Sequential"
      : (DEFAULT_CONVERSATION_TEMPLATES.find(
          (template) => template.id === conversation.template_id,
        )?.name ?? "Check-in");

  if (channelLabel) {
    return `${channelLabel} · ${typeLabel}`;
  }

  return formatSchedulePreview(
    conversation.time_local,
    conversation.timezone,
    conversation.frequency,
    conversation.days_of_week,
    conversation.enabled,
  );
}

export function memberInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function memberResponseNote(
  member: ConversationRunRespondedMember,
): string | null {
  const lastUserMessage = member.transcript
    ?.filter((message) => message.role === "user")
    .at(-1);
  if (lastUserMessage?.content.trim()) {
    return lastUserMessage.content.trim();
  }

  const lastLegacyResponse = member.legacy_responses?.at(-1);
  if (lastLegacyResponse?.answer_text.trim()) {
    return lastLegacyResponse.answer_text.trim();
  }

  return null;
}
