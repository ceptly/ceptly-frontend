"use client";

import { useRouter } from "next/navigation";

import { ConversationEditForm } from "@/components/settings/conversation-edit-form";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type { AppContextOption, ScheduledConversation } from "@/lib/api/types";

interface ConversationEditPageClientProps {
  conversation: ScheduledConversation;
  workspaceId: string;
  rosterMembers: RosterMember[];
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
}

export function ConversationEditPageClient({
  conversation,
  workspaceId,
  rosterMembers,
  appContextOptions,
  slackChannels,
  slackChannelsError,
}: ConversationEditPageClientProps) {
  const router = useRouter();
  const activityHref = `/activity/${conversation.id}`;

  return (
    <ConversationEditForm
      conversation={conversation}
      workspaceId={workspaceId}
      rosterMembers={rosterMembers}
      appContextOptions={appContextOptions}
      slackChannels={slackChannels}
      slackChannelsError={slackChannelsError}
      onCancel={() => router.push(activityHref)}
      onSaved={() => {
        router.push(activityHref);
        router.refresh();
      }}
    />
  );
}
