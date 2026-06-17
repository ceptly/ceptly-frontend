"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ConversationRail } from "@/components/chat/conversation-rail";
import { PlaygroundConversationView } from "@/components/chat/playground-conversation-view";
import { EmployeeChatPrompt } from "@/components/employee-chat-prompt";
import { Button } from "@/components/ui/button";
import {
  deletePlaygroundConversationAction,
  listPlaygroundConversationsAction,
} from "@/actions/playground";
import type { AppContextOption } from "@/lib/api/types";
import type {
  ChatChannel,
  CommunicationPlatform,
} from "@/lib/api/communication";
import type { PersonaOption } from "@/lib/api/personas";
import type { PlaygroundConversationSummary } from "@/lib/api/playground";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import type { SetupChatMessage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ChatWorkspaceProps {
  workspaceId: string;
  canEdit: boolean;
  appContextOptions: AppContextOption[];
  slackChannels: SlackChannel[];
  slackChannelsError: string | null;
  rosterMembers: RosterMember[];
  initialMessages: SetupChatMessage[];
  initialSessionId: string | null;
  workspaceTimezone: string;
  chatChannels: ChatChannel[];
  communicationPlatform: CommunicationPlatform;
  chatChannelsError: string | null;
  personas: PersonaOption[];
  initialPlaygroundConversations: PlaygroundConversationSummary[];
}

export function ChatWorkspace({
  workspaceId,
  canEdit,
  appContextOptions,
  slackChannels,
  slackChannelsError,
  rosterMembers,
  initialMessages,
  initialSessionId,
  workspaceTimezone,
  chatChannels,
  communicationPlatform,
  chatChannelsError,
  personas,
  initialPlaygroundConversations,
}: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState(
    initialPlaygroundConversations,
  );
  const [mode, setMode] = useState<"assistant" | "playground">("assistant");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [railOpen, setRailOpen] = useState(false);

  const refreshConversations = useCallback(async () => {
    const result = await listPlaygroundConversationsAction({ workspaceId });
    if (result.conversations) {
      setConversations(result.conversations);
    }
  }, [workspaceId]);

  const handleNewChat = useCallback(() => {
    setMode("assistant");
    setSelectedSessionId(null);
    setRailOpen(false);
  }, []);

  const handleSelect = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setMode("playground");
    setRailOpen(false);
  }, []);

  const handleConversationStarted = useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      setMode("playground");
      setRailOpen(false);
      void refreshConversations();
    },
    [refreshConversations],
  );

  const handleDelete = useCallback(
    async (sessionId: string) => {
      const result = await deletePlaygroundConversationAction({
        workspaceId,
        sessionId,
      });
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
        return;
      }
      setConversations((current) =>
        current.filter((conversation) => conversation.sessionId !== sessionId),
      );
      setSelectedSessionId((current) => {
        if (current === sessionId) {
          setMode("assistant");
          return null;
        }
        return current;
      });
    },
    [workspaceId],
  );

  return (
    <div className="flex h-full min-h-0 w-full gap-4">
      {/* Left rail */}
      <aside
        className={cn(
          "min-h-0 w-[260px] shrink-0 flex-col border-r border-border pr-4",
          railOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <ConversationRail
          workspaceId={workspaceId}
          conversations={conversations}
          selectedSessionId={selectedSessionId}
          mode={mode}
          onNewChat={handleNewChat}
          onSelect={handleSelect}
          onDelete={(sessionId) => void handleDelete(sessionId)}
          onConversationStarted={handleConversationStarted}
        />
      </aside>

      {/* Main pane */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mb-2 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setRailOpen((open) => !open)}
          >
            <PanelLeft className="size-4" />
            Conversations
          </Button>
        </div>

        {/* Assistant chat stays mounted so its state survives mode switches. */}
        <div
          className={cn(
            "min-h-0 flex-1 flex-col",
            mode === "assistant" ? "flex" : "hidden",
          )}
        >
          <EmployeeChatPrompt
            workspaceId={workspaceId}
            canEdit={canEdit}
            appContextOptions={appContextOptions}
            slackChannels={slackChannels}
            slackChannelsError={slackChannelsError}
            rosterMembers={rosterMembers}
            initialMessages={initialMessages}
            initialSessionId={initialSessionId}
            workspaceTimezone={workspaceTimezone}
            chatChannels={chatChannels}
            communicationPlatform={communicationPlatform}
            chatChannelsError={chatChannelsError}
            personas={personas}
            onPlaygroundStarted={handleConversationStarted}
          />
        </div>

        {mode === "playground" && selectedSessionId ? (
          <PlaygroundConversationView
            key={selectedSessionId}
            workspaceId={workspaceId}
            sessionId={selectedSessionId}
            onConversationUpdated={() => void refreshConversations()}
          />
        ) : null}
      </div>
    </div>
  );
}
