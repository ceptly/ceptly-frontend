"use client";

import { useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

import { fetchAgentSessionDetail } from "@/actions/agents";
import { AgentTranscriptList } from "@/components/activity/agent-transcript-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatActivityLatestLabel } from "@/lib/activity/rollup-card";
import type { AgentSessionDetail, AgentSessionMessage, AgentSessionRow } from "@/lib/api/agents";

interface AgentSessionDetailViewProps {
  workspaceId: string;
  agentId: string;
  sessions: AgentSessionRow[];
  initialSession: AgentSessionDetail | null;
  agentName: string;
  subtitle: string;
  actions?: ReactNode;
}

function AgentSessionPicker({
  sessions,
  selectedSessionId,
  loading,
  onSelect,
}: {
  sessions: AgentSessionRow[];
  selectedSessionId: string;
  loading: boolean;
  onSelect: (sessionId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (sessionId: string) => {
    setOpen(false);
    onSelect(sessionId);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            id="agent-session-select"
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 font-normal"
            disabled={loading}
          />
        }
      >
        <Calendar className="size-3.5 shrink-0 opacity-70" />
        <span className="max-w-[240px] truncate">
          {sessions.find((s) => s.session_id === selectedSessionId)
            ? formatActivityLatestLabel(
                sessions.find((s) => s.session_id === selectedSessionId)!
                  .scheduled_fire_at ?? sessions.find((s) => s.session_id === selectedSessionId)!.started_at,
              )
            : "Select session"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[268px]"
        finalFocus={false}
      >
        <DropdownMenuRadioGroup
          value={selectedSessionId}
          onValueChange={handleSelect}
        >
          <DropdownMenuLabel className="px-2 pb-1 text-[11px] font-semibold tracking-[0.05em] uppercase">
            Past sessions
          </DropdownMenuLabel>
          {sessions.map((session) => (
            <DropdownMenuRadioItem
              key={session.session_id}
              value={session.session_id}
              closeOnClick
              className="items-start py-2"
            >
              <span className="min-w-0">
                <span className="block font-medium">
                  {formatActivityLatestLabel(
                    session.scheduled_fire_at ?? session.started_at,
                  )}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                  {session.status}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function participantStatusBadge(status: "in_progress" | "completed" | "abandoned") {
  if (status === "completed") {
    return (
      <Badge variant="complete" className="gap-1">
        <Check className="size-3" />
        Responded
      </Badge>
    );
  }
  if (status === "abandoned") {
    return <Badge variant="destructive">No response</Badge>;
  }
  return <Badge variant="secondary">In progress</Badge>;
}

export function AgentSessionDetailView({
  workspaceId,
  agentId,
  sessions,
  initialSession,
  agentName,
  subtitle,
  actions,
}: AgentSessionDetailViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialSession?.session.session_id ?? sessions[0]?.session_id ?? "",
  );
  const [detail, setDetail] = useState<AgentSessionDetail | null>(
    initialSession,
  );
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    initialSession?.session.session_id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preserveScrollPosition = () => {
    const scrollY = window.scrollY;
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    });
  };

  const handleSelect = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setError(null);
    if (sessionId === loadedSessionId && detail) {
      preserveScrollPosition();
      return;
    }
    const scrollY = window.scrollY;
    setLoading(true);
    const result = await fetchAgentSessionDetail({
      workspaceId,
      agentId,
      sessionId,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      return;
    }
    setDetail(result.detail);
    setLoadedSessionId(sessionId);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    });
  };

  if (sessions.length === 0) {
    return (
      <>
        <div className="ceptly-page-head">
          <h1 className="ceptly-page-title">{agentName}</h1>
          <p className="ceptly-page-sub">{subtitle}</p>
        </div>
        {actions ? <div className="mb-6">{actions}</div> : null}
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      </>
    );
  }

  const messages: AgentSessionMessage[] | undefined = detail?.messages;

  return (
    <>
      <div className="ceptly-page-head ceptly-page-head-split">
        <div>
          <h1 className="ceptly-page-title">{agentName}</h1>
          <p className="ceptly-page-sub">{subtitle}</p>
        </div>
        <AgentSessionPicker
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          loading={loading}
          onSelect={(sessionId) => void handleSelect(sessionId)}
        />
      </div>

      {actions ? <div className="mb-6">{actions}</div> : null}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading session…
        </div>
      ) : detail ? (
        <div className="ceptly-section-stack">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{detail.session.status}</Badge>
          </div>

          {detail.session.summary_text ? (
            <section className="ceptly-section">
              <h2 className="ceptly-section-title">
                <Sparkles className="text-brand" aria-hidden />
                Conclusion summary
              </h2>
              <div className="ceptly-glass-card p-[18px]">
                <p className="text-sm leading-[1.6] whitespace-pre-wrap">
                  {detail.session.summary_text}
                </p>
              </div>
            </section>
          ) : null}

          {detail.participants.length > 0 ? (
            <section className="ceptly-section">
              <h2 className="ceptly-section-title">
                <Users aria-hidden />
                Participants
              </h2>
              <div className="ceptly-list-card">
                {detail.participants.map((p, i) => (
                  <div key={p.id} className="ceptly-list-row items-center">
                    <span className="ceptly-avatar ceptly-avatar-sm">
                      {i + 1}
                    </span>
                    <div className="ceptly-list-main">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ceptly-list-name font-mono text-xs">
                          {p.roster_member_id
                            ? p.roster_member_id.slice(0, 8)
                            : "—"}
                        </span>
                        {participantStatusBadge(p.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="ceptly-section">
            <h2 className="ceptly-section-title">
              <MessageSquare aria-hidden />
              Thread
            </h2>
            <AgentTranscriptList
              agentMessages={messages}
              icDisplayName="Participant"
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
