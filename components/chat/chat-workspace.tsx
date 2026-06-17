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
import {
  deleteChatSessionAction,
  loadChatSessionAction,
} from "@/actions/workspace-chat";
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
import type { ChatSessionSummary } from "@/lib/api/workspace-chat-history";
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
  initialChatSessions: ChatSessionSummary[];
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
  initialChatSessions,
}: ChatWorkspaceProps) {
  const [playgroundConversations, setPlaygroundConversations] = useState(
    initialPlaygroundConversations,
  );
  const [chatSessions, setChatSessions] = useState(initialChatSessions);

  // "assistant" = /chat conversation; "playground" = playground agent run; "past-chat" = viewing a past assistant session
  const [mode, setMode] = useState<"assistant" | "playground" | "past-chat">(
    "assistant",
  );
  const [selectedPlaygroundSessionId, setSelectedPlaygroundSessionId] =
    useState<string | null>(null);

  // Past assistant conversation being viewed
  const [pastChatSessionId, setPastChatSessionId] = useState<string | null>(
    null,
  );
  const [pastChatMessages, setPastChatMessages] = useState<SetupChatMessage[]>(
    [],
  );
  // Incrementing key forces EmployeeChatPrompt to remount when switching sessions
  const [assistantKey, setAssistantKey] = useState(0);
  const [assistantInitialMessages, setAssistantInitialMessages] =
    useState(initialMessages);
  const [assistantInitialSessionId, setAssistantInitialSessionId] = useState(
    initialSessionId,
  );

  const [railOpen, setRailOpen] = useState(false);

  const refreshPlaygroundConversations = useCallback(async () => {
    const result = await listPlaygroundConversationsAction({ workspaceId });
    if (result.conversations) {
      setPlaygroundConversations(result.conversations);
    }
  }, [workspaceId]);

  const handleNewChat = useCallback(() => {
    setMode("assistant");
    setPastChatSessionId(null);
    // Reset to a blank slate, remounting EmployeeChatPrompt
    setAssistantInitialMessages([]);
    setAssistantInitialSessionId(null);
    setAssistantKey((k) => k + 1);
    setRailOpen(false);
  }, []);

  const handleSelectPastChat = useCallback(
    async (sessionId: string) => {
      setRailOpen(false);
      const result = await loadChatSessionAction({ workspaceId, sessionId });
      if (result.error || !result.messages) {
        toast.error("Could not load conversation", { description: result.error });
        return;
      }
      setPastChatSessionId(sessionId);
      setAssistantInitialMessages(result.messages);
      setAssistantInitialSessionId(sessionId);
      setAssistantKey((k) => k + 1);
      setMode("past-chat");
    },
    [workspaceId],
  );

  const handleSelectPlayground = useCallback((sessionId: string) => {
    setSelectedPlaygroundSessionId(sessionId);
    setMode("playground");
    setRailOpen(false);
  }, []);

  const handlePlaygroundConversationStarted = useCallback(
    (sessionId: string) => {
      setSelectedPlaygroundSessionId(sessionId);
      setMode("playground");
      setRailOpen(false);
      void refreshPlaygroundConversations();
    },
    [refreshPlaygroundConversations],
  );

  const handleDeletePlayground = useCallback(
    async (sessionId: string) => {
      const result = await deletePlaygroundConversationAction({
        workspaceId,
        sessionId,
      });
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
        return;
      }
      setPlaygroundConversations((current) =>
        current.filter((c) => c.sessionId !== sessionId),
      );
      if (selectedPlaygroundSessionId === sessionId) {
        setMode("assistant");
        setSelectedPlaygroundSessionId(null);
      }
    },
    [workspaceId, selectedPlaygroundSessionId],
  );

  const handleDeleteChatSession = useCallback(
    async (sessionId: string) => {
      const result = await deleteChatSessionAction({ workspaceId, sessionId });
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
        return;
      }
      setChatSessions((current) => current.filter((s) => s.id !== sessionId));
      if (pastChatSessionId === sessionId) {
        handleNewChat();
      }
    },
    [workspaceId, pastChatSessionId, handleNewChat],
  );

  const handleSessionStarted = useCallback(
    (sessionId: string, preview: string) => {
      setChatSessions((current) => {
        // Avoid duplicates if already present
        if (current.some((s) => s.id === sessionId)) return current;
        const now = new Date().toISOString();
        return [
          { id: sessionId, agentId: null, preview, createdAt: now, updatedAt: now },
          ...current,
        ];
      });
    },
    [],
  );

  const isAssistantVisible = mode === "assistant" || mode === "past-chat";

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
          chatSessions={chatSessions}
          selectedChatSessionId={pastChatSessionId}
          playgroundConversations={playgroundConversations}
          selectedPlaygroundSessionId={selectedPlaygroundSessionId}
          mode={mode}
          onNewChat={handleNewChat}
          onSelectChatSession={(id) => void handleSelectPastChat(id)}
          onDeleteChatSession={(id) => void handleDeleteChatSession(id)}
          onSelectPlayground={handleSelectPlayground}
          onDeletePlayground={(id) => void handleDeletePlayground(id)}
          onConversationStarted={handlePlaygroundConversationStarted}
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

        {/* Assistant chat — remounts when key changes (new chat or past session selected). */}
        <div
          className={cn(
            "min-h-0 flex-1 flex-col",
            isAssistantVisible ? "flex" : "hidden",
          )}
        >
          <EmployeeChatPrompt
            key={assistantKey}
            workspaceId={workspaceId}
            canEdit={canEdit}
            appContextOptions={appContextOptions}
            slackChannels={slackChannels}
            slackChannelsError={slackChannelsError}
            rosterMembers={rosterMembers}
            initialMessages={assistantInitialMessages}
            initialSessionId={assistantInitialSessionId}
            workspaceTimezone={workspaceTimezone}
            chatChannels={chatChannels}
            communicationPlatform={communicationPlatform}
            chatChannelsError={chatChannelsError}
            personas={personas}
            onPlaygroundStarted={handlePlaygroundConversationStarted}
            onSessionStarted={handleSessionStarted}
          />
        </div>

        {mode === "playground" && selectedPlaygroundSessionId ? (
          <PlaygroundConversationView
            key={selectedPlaygroundSessionId}
            workspaceId={workspaceId}
            sessionId={selectedPlaygroundSessionId}
            onConversationUpdated={() => void refreshPlaygroundConversations()}
          />
        ) : null}
      </div>
    </div>
  );
}
