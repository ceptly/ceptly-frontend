"use client";

import { FlaskConical, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  listPlaygroundAgentsAction,
  runPlaygroundAgentAction,
} from "@/actions/playground";
import type {
  PlaygroundAgentSummary,
  PlaygroundConversationSummary,
} from "@/lib/api/playground";
import type { ChatSessionSummary } from "@/lib/api/workspace-chat-history";
import { cn } from "@/lib/utils";

interface ConversationRailProps {
  workspaceId: string;
  chatSessions: ChatSessionSummary[];
  selectedChatSessionId: string | null;
  playgroundConversations: PlaygroundConversationSummary[];
  selectedPlaygroundSessionId: string | null;
  mode: "assistant" | "playground" | "past-chat";
  loadingChatSessionId?: string | null;
  onNewChat: () => void;
  onSelectChatSession: (sessionId: string) => void;
  onDeleteChatSession: (sessionId: string) => void;
  onSelectPlayground: (sessionId: string) => void;
  onDeletePlayground: (sessionId: string) => void;
  /** Called with the new session id after a playground agent is run. */
  onConversationStarted: (sessionId: string) => void;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ConversationRail({
  workspaceId,
  chatSessions,
  selectedChatSessionId,
  playgroundConversations,
  selectedPlaygroundSessionId,
  mode,
  loadingChatSessionId = null,
  onNewChat,
  onSelectChatSession,
  onDeleteChatSession,
  onSelectPlayground,
  onDeletePlayground,
  onConversationStarted,
}: ConversationRailProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [agents, setAgents] = useState<PlaygroundAgentSummary[] | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  async function openPicker() {
    setPickerOpen((open) => !open);
    if (agents || loadingAgents) return;
    setLoadingAgents(true);
    const result = await listPlaygroundAgentsAction({ workspaceId });
    setLoadingAgents(false);
    if (result.error) {
      toast.error("Could not load agents", { description: result.error });
      return;
    }
    setAgents(result.agents ?? []);
  }

  async function runAgent(agentId: string) {
    setRunningAgentId(agentId);
    const result = await runPlaygroundAgentAction({ workspaceId, agentId });
    setRunningAgentId(null);
    if (result.error || !result.sessionId) {
      toast.error("Could not start conversation", {
        description: result.error,
      });
      return;
    }
    setPickerOpen(false);
    onConversationStarted(result.sessionId);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "justify-start gap-2",
          mode === "assistant" && "border-primary/40 bg-primary/5",
        )}
        onClick={onNewChat}
      >
        <Plus className="size-4" />
        New chat
      </Button>

      {/* Past assistant conversations */}
      <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
        <p className="px-1 py-1 text-xs font-medium text-muted-foreground">
          Past conversations
        </p>
        {chatSessions.length > 0 ? (
          <ul className="flex flex-col gap-0.5">
              {chatSessions.map((session) => {
                const selected =
                  mode === "past-chat" &&
                  session.id === selectedChatSessionId;
                const loading = loadingChatSessionId === session.id;
                return (
                  <li key={session.id} className="group relative">
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-md px-2 py-1.5 pr-7 text-left hover:bg-muted",
                        selected && "bg-muted",
                      )}
                      disabled={loadingChatSessionId !== null}
                      onClick={() => onSelectChatSession(session.id)}
                    >
                      <span className="flex items-center gap-1.5">
                        {loading ? (
                          <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        <span className="block truncate text-sm font-medium text-foreground">
                          {session.preview ?? "New conversation"}
                        </span>
                      </span>
                      <span className="block text-[11px] text-muted-foreground pl-4.5">
                        {relativeTime(session.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      className="absolute top-1.5 right-1 hidden rounded-sm p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:block"
                      onClick={() => onDeleteChatSession(session.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
          </ul>
        ) : (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            Your past conversations will appear here.
          </p>
        )}

        {/* Playground section */}
        <div className="mt-3">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => void openPicker()}
            >
              <FlaskConical className="size-4" />
              Test an agent
            </Button>
            {pickerOpen ? (
              <div className="absolute top-full left-0 z-10 mt-1 max-h-[280px] w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
                {loadingAgents ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : agents && agents.length > 0 ? (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => void runAgent(agent.id)}
                      disabled={runningAgentId !== null}
                    >
                      <span className="truncate">{agent.name}</span>
                      {runningAgentId === agent.id ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {agent.destination === "channel" ? "Channel" : "DM"}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    No playground agents yet. Deploy one with Environment =
                    Playground.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {playgroundConversations.length > 0 ? (
            <>
              <p className="px-1 py-1 text-xs font-medium text-muted-foreground">
                Playground conversations
              </p>
              <ul className="flex flex-col gap-0.5">
                {playgroundConversations.map((conversation) => {
                  const selected =
                    mode === "playground" &&
                    conversation.sessionId === selectedPlaygroundSessionId;
                  return (
                    <li key={conversation.sessionId} className="group relative">
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-md px-2 py-1.5 pr-7 text-left hover:bg-muted",
                          selected && "bg-muted",
                        )}
                        onClick={() => onSelectPlayground(conversation.sessionId)}
                      >
                        <span className="block truncate text-sm font-medium text-foreground">
                          {conversation.agentName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {conversation.preview ?? "No messages yet"}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {relativeTime(
                            conversation.lastMessageAt ?? conversation.startedAt,
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        className="absolute top-1.5 right-1 hidden rounded-sm p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:block"
                        onClick={() => onDeletePlayground(conversation.sessionId)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
