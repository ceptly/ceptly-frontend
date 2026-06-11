"use client";

import { useEffect, useRef } from "react";

import { AgentActivityFeed } from "@/components/chat/agent-activity-feed";
import { CeptlyAgentAvatar } from "@/components/ceptly-agent-avatar";
import { MentionMessageContent } from "@/components/chat/mention-message-content";
import { SetupRecapPickers } from "@/components/chat/setup-recap-pickers";
import { ScheduleDaysPicker } from "@/components/settings/schedule-days-picker";
import { Badge } from "@/components/ui/badge";
import type { AgentActivityState } from "@/lib/api/workspace-chat-stream";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type {
  AppContextOption,
  SetupChatMessage,
  SetupRecapUiComponent,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ChatMessageListProps {
  messages: SetupChatMessage[];
  pending?: boolean;
  pendingActivity?: AgentActivityState | null;
  className?: string;
  onDaysChange?: (messageIndex: number, days: number[]) => void;
  onMembersChange?: (messageIndex: number, memberIds: string[]) => void;
  onSetupRecapChange?: (
    messageIndex: number,
    recap: SetupRecapUiComponent,
  ) => void;
  appContextOptions?: AppContextOption[];
  slackChannels?: SlackChannel[];
  slackChannelsError?: string | null;
  interactiveDisabled?: boolean;
  rosterMembers?: RosterMember[];
}

export function ChatMessageList({
  messages,
  pending = false,
  pendingActivity = null,
  className,
  onDaysChange,
  onMembersChange,
  onSetupRecapChange,
  appContextOptions = [],
  slackChannels = [],
  slackChannelsError,
  interactiveDisabled = false,
  rosterMembers = [],
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, pendingActivity]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const dayPicker =
          !isUser && message.ui_component?.type === "day_picker"
            ? message.ui_component
            : null;
        const memberPicker =
          !isUser && message.ui_component?.type === "member_picker"
            ? message.ui_component
            : null;
        const setupRecap =
          !isUser && message.ui_component?.type === "setup_recap"
            ? message.ui_component
            : null;

        return (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "flex gap-2.5",
              isUser ? "flex-row-reverse" : "flex-row",
            )}
          >
            {!isUser ? <CeptlyAgentAvatar /> : null}

            <div
              className={cn(
                "flex max-w-[min(85%,32rem)] flex-col gap-2",
                isUser ? "items-end" : "items-start",
              )}
            >
              <span className="px-1 text-xs font-medium text-muted-foreground">
                {isUser ? "You" : "Ceptly"}
              </span>

              {!isUser && message.activity ? (
                <AgentActivityFeed activity={message.activity} />
              ) : null}

              <div
                className={cn(
                  "px-[15px] py-[11px] text-sm leading-relaxed",
                  isUser ? "ceptly-chat-bubble-user" : "ceptly-chat-bubble-ai",
                )}
              >
                {isUser ? (
                  <MentionMessageContent
                    content={message.content}
                    rosterMembers={rosterMembers}
                    slackChannels={slackChannels}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {dayPicker ? (
                <div className="ceptly-glass-card w-full p-4">
                  <ScheduleDaysPicker
                    daysOfWeek={dayPicker.days_of_week}
                    onChange={(days) => onDaysChange?.(index, days)}
                    disabled={interactiveDisabled}
                    showLabel={false}
                  />
                </div>
              ) : null}

              {memberPicker ? (
                <div className="ceptly-glass-card w-full space-y-3 p-4">
                  <p className="text-sm font-medium">Confirm who to message</p>
                  <div className="flex flex-col gap-2">
                    {memberPicker.members.map((member) => {
                      const selected =
                        memberPicker.selected_member_ids.includes(member.id);

                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={interactiveDisabled}
                          className="flex items-center justify-between border border-border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            const nextIds = selected
                              ? memberPicker.selected_member_ids.filter(
                                  (id) => id !== member.id,
                                )
                              : [
                                  ...new Set([
                                    ...memberPicker.selected_member_ids,
                                    member.id,
                                  ]),
                                ];
                            onMembersChange?.(index, nextIds);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {member.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                          <Badge variant={selected ? "default" : "outline"}>
                            {selected ? "Selected" : "Select"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {setupRecap ? (
                <SetupRecapPickers
                  recap={setupRecap}
                  appContextOptions={appContextOptions}
                  slackChannels={slackChannels}
                  slackChannelsError={slackChannelsError}
                  disabled={interactiveDisabled}
                  onChange={(recap) => onSetupRecapChange?.(index, recap)}
                />
              ) : null}
            </div>
          </div>
        );
      })}

      {pending && pendingActivity ? (
        <div className="flex gap-2.5">
          <CeptlyAgentAvatar />
          <div className="flex max-w-[min(85%,32rem)] flex-col gap-1">
            <span className="px-1 text-xs font-medium text-muted-foreground">
              Ceptly
            </span>
            <AgentActivityFeed activity={pendingActivity} isLive />
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
