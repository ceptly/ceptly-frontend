"use client";

import { ArrowUp, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CeptlyAgentAvatar } from "@/components/ceptly-agent-avatar";
import { Button } from "@/components/ui/button";
import {
  getPlaygroundConversationAction,
  postPlaygroundReplyAction,
} from "@/actions/playground";
import type {
  PlaygroundConversationDetail,
  PlaygroundConversationMessage,
  PlaygroundConversationParticipant,
} from "@/lib/api/playground";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2500;

interface PlaygroundConversationViewProps {
  workspaceId: string;
  sessionId: string;
  /** Notifies the rail so it can refresh previews/order after a turn. */
  onConversationUpdated?: () => void;
}

/** platformUserId → display name, for rendering `<@pg:…>` mentions as @Name. */
function buildNameByPlatformId(
  participants: PlaygroundConversationParticipant[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const participant of participants) {
    if (participant.platformUserId && participant.displayName) {
      map.set(participant.platformUserId, participant.displayName);
    }
  }
  return map;
}

/** Render Slack-mrkdwn-ish tokens as plain text: mentions → @Name, links → label. */
function formatContent(
  content: string,
  nameByPlatformId: Map<string, string>,
): string {
  return content
    .replace(/<@([^>]+)>/g, (_match, id: string) => {
      const name = nameByPlatformId.get(id);
      if (name) return `@${name}`;
      return `@${id.replace(/^pg:/, "")}`;
    })
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, (_match, _url, label: string) => label)
    .replace(/<(https?:[^>]+)>/g, (_match, url: string) => url);
}

function firstName(displayName: string): string {
  return displayName.split(/\s+/)[0] ?? displayName;
}

function icNameFor(
  message: PlaygroundConversationMessage,
  participants: PlaygroundConversationParticipant[],
): string {
  const match = participants.find(
    (participant) => participant.rosterMemberId === message.rosterMemberId,
  );
  return match?.displayName ? firstName(match.displayName) : "Teammate";
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PlaygroundConversationView({
  workspaceId,
  sessionId,
  onConversationUpdated,
}: PlaygroundConversationViewProps) {
  const [detail, setDetail] = useState<PlaygroundConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actingAs, setActingAs] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actorMenuOpen, setActorMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const onUpdatedRef = useRef(onConversationUpdated);
  useEffect(() => {
    onUpdatedRef.current = onConversationUpdated;
  }, [onConversationUpdated]);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      // No synchronous setState here: `loading` starts true and is cleared once
      // the first (non-silent) load resolves. Polling refreshes pass silent.
      const result = await getPlaygroundConversationAction({
        workspaceId,
        sessionId,
      });
      if (result.conversation) {
        setDetail(result.conversation);
      }
      if (!options?.silent) setLoading(false);
    },
    [workspaceId, sessionId],
  );

  // Load on mount. The parent keys this component by sessionId, so opening a
  // different conversation remounts it with fresh state — no reset needed.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getPlaygroundConversationAction({
        workspaceId,
        sessionId,
      });
      if (cancelled) return;
      if (result.conversation) setDetail(result.conversation);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, sessionId]);

  // Poll for agent turns / scheduled fires while the conversation is active.
  useEffect(() => {
    if (detail && detail.session.status !== "active") return;
    const handle = setInterval(() => {
      void refresh({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [detail, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [detail?.messages.length]);

  const participants = detail?.participants ?? [];
  const nameByPlatformId = buildNameByPlatformId(participants);
  const replyParticipants = participants.filter((p) => p.rosterMemberId);
  // Derive the default speaker (first participant) rather than setting it in an
  // effect; an explicit pick overrides it.
  const effectiveActingAs =
    actingAs ?? replyParticipants[0]?.rosterMemberId ?? null;
  const actingParticipant = replyParticipants.find(
    (p) => p.rosterMemberId === effectiveActingAs,
  );
  const isActive = detail?.session.status === "active";
  const canSend =
    Boolean(input.trim()) && Boolean(effectiveActingAs) && !sending;

  async function handleSend() {
    if (!canSend || !effectiveActingAs) return;
    const text = input.trim();
    setSending(true);
    setInput("");
    const result = await postPlaygroundReplyAction({
      workspaceId,
      sessionId,
      rosterMemberId: effectiveActingAs,
      text,
    });
    setSending(false);
    if (result.error) {
      toast.error("Reply failed", { description: result.error });
      setInput(text);
      return;
    }
    await refresh({ silent: true });
    onUpdatedRef.current?.();
  }

  if (loading && !detail) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        This conversation could not be loaded.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">
          {detail.session.agentName}
        </h2>
        <p className="text-xs text-muted-foreground">
          {detail.session.destination === "channel"
            ? `Channel · ${detail.session.style ?? "broadcast"}`
            : "Direct messages"}{" "}
          · {detail.session.status}
        </p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-[700px] flex-col gap-4">
          {detail.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. The agent&apos;s opener will appear here.
            </p>
          ) : (
            detail.messages.map((message) => {
              const isAgent = message.role === "agent";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    isAgent ? "flex-row" : "flex-row-reverse",
                  )}
                >
                  {isAgent ? <CeptlyAgentAvatar /> : null}
                  <div
                    className={cn(
                      "flex max-w-[min(85%,32rem)] flex-col gap-1.5",
                      isAgent ? "items-start" : "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 px-1 text-xs text-muted-foreground",
                        isAgent ? "justify-start" : "justify-end",
                      )}
                    >
                      <span className="font-medium">
                        {isAgent ? "Ceptly" : icNameFor(message, participants)}
                      </span>
                      <time dateTime={message.createdAt}>
                        {formatTimestamp(message.createdAt)}
                      </time>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        isAgent
                          ? "rounded-bl-md border border-border bg-card text-card-foreground"
                          : "rounded-br-md bg-primary text-primary-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">
                        {formatContent(message.content, nameByPlatformId)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mx-auto w-full max-w-[700px]">
          {isActive ? (
            <>
              <div className="relative mb-2 inline-block">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                  onClick={() => setActorMenuOpen((open) => !open)}
                  disabled={replyParticipants.length === 0}
                >
                  Replying as{" "}
                  <span className="font-medium">
                    {actingParticipant?.displayName ?? "—"}
                  </span>
                  <ChevronDown className="size-3.5" />
                </button>
                {actorMenuOpen ? (
                  <div className="absolute bottom-full left-0 z-10 mb-1 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md">
                    {replyParticipants.map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        className={cn(
                          "block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted",
                          participant.rosterMemberId === effectiveActingAs &&
                            "bg-muted font-medium",
                        )}
                        onClick={() => {
                          if (participant.rosterMemberId) {
                            setActingAs(participant.rosterMemberId);
                          }
                          setActorMenuOpen(false);
                        }}
                      >
                        {participant.displayName ?? "Teammate"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSend();
                }}
              >
                <textarea
                  className="min-h-[44px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={1}
                  placeholder={`Reply as ${
                    actingParticipant?.displayName ?? "a participant"
                  }…`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!canSend}
                  aria-label="Send reply"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowUp />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              This conversation is {detail.session.status}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
