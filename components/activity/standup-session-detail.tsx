"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

import { fetchStandupSessionDetail } from "@/actions/standups";
import { CheckinTranscriptMessageList } from "@/components/activity/checkin-transcript-message-list";
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
import { memberInitials } from "@/lib/activity/conversation-detail";
import { buildStandupResponseRows } from "@/lib/activity/standup-detail";
import { formatActivityLatestLabel } from "@/lib/activity/rollup-card";
import type {
  StandupSessionDetail,
  StandupSessionSummary,
} from "@/lib/api/types";

interface StandupSessionDetailViewProps {
  workspaceId: string;
  standupId: string;
  sessions: StandupSessionSummary[];
  initialSession: StandupSessionDetail | null;
  standupName: string;
  subtitle: string;
  actions?: ReactNode;
}

function StandupSessionPicker({
  sessions,
  selectedSessionId,
  loading,
  onSelect,
}: {
  sessions: StandupSessionSummary[];
  selectedSessionId: string;
  loading: boolean;
  onSelect: (sessionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedSession = sessions.find(
    (session) => session.session_id === selectedSessionId,
  );

  const handleSelect = (sessionId: string) => {
    setOpen(false);
    onSelect(sessionId);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            id="standup-session-select"
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
          {selectedSession
            ? formatActivityLatestLabel(selectedSession.scheduled_fire_at)
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
                  {formatActivityLatestLabel(session.scheduled_fire_at)}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                  {session.responded_count}/{session.participant_count}{" "}
                  responded · {session.status}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ResponseRow({
  name,
  note,
  responded,
}: {
  name: string;
  note: string | null;
  responded: boolean;
}) {
  return (
    <div className="ceptly-list-row items-start">
      <span className="ceptly-avatar ceptly-avatar-sm">{memberInitials(name)}</span>
      <div className="ceptly-list-main">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ceptly-list-name">{name}</span>
          {responded ? (
            <Badge variant="complete" className="gap-1">
              <Check className="size-3" />
              Responded
            </Badge>
          ) : (
            <Badge variant="secondary">Waiting</Badge>
          )}
        </div>
        {note ? (
          <p className="ceptly-list-desc mt-1.5">{note}</p>
        ) : (
          <p className="ceptly-list-desc mt-1.5 italic">No reply yet.</p>
        )}
      </div>
    </div>
  );
}

export function StandupSessionDetailView({
  workspaceId,
  standupId,
  sessions,
  initialSession,
  standupName,
  subtitle,
  actions,
}: StandupSessionDetailViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    initialSession?.session_id ?? sessions[0]?.session_id ?? "",
  );
  const [detail, setDetail] = useState<StandupSessionDetail | null>(
    initialSession,
  );
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    initialSession?.session_id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const responseRows = useMemo(
    () => (detail ? buildStandupResponseRows(detail) : []),
    [detail],
  );

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
    const result = await fetchStandupSessionDetail({
      workspaceId,
      standupId,
      sessionId,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      return;
    }
    setDetail(result.session);
    setLoadedSessionId(sessionId);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    });
  };

  useEffect(() => {
    const initialId = initialSession?.session_id ?? sessions[0]?.session_id;
    if (initialId && !loadedSessionId) {
      void handleSelect(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load first session once
  }, []);

  if (sessions.length === 0) {
    return (
      <>
        <div className="ceptly-page-head">
          <h1 className="ceptly-page-title">{standupName}</h1>
          <p className="ceptly-page-sub">{subtitle}</p>
        </div>
        {actions ? <div className="mb-6">{actions}</div> : null}
        <p className="text-sm text-muted-foreground">
          No standup sessions yet.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="ceptly-page-head ceptly-page-head-split">
        <div>
          <h1 className="ceptly-page-title">{standupName}</h1>
          <p className="ceptly-page-sub">{subtitle}</p>
        </div>
        <StandupSessionPicker
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
            <Badge variant="outline">{detail.status}</Badge>
          </div>

          {detail.summary_text ? (
            <section className="ceptly-section">
              <h2 className="ceptly-section-title">
                <Sparkles className="text-brand" aria-hidden />
                Conclusion summary
              </h2>
              <div className="ceptly-glass-card p-[18px]">
                <p className="text-sm leading-[1.6] whitespace-pre-wrap">
                  {detail.summary_text}
                </p>
              </div>
            </section>
          ) : null}

          <section className="ceptly-section">
            <h2 className="ceptly-section-title">
              <Users aria-hidden />
              Responses
            </h2>
            {responseRows.length > 0 ? (
              <div className="ceptly-list-card">
                {responseRows.map((row) => (
                  <ResponseRow
                    key={row.key}
                    name={row.name}
                    note={row.note}
                    responded={row.responded}
                  />
                ))}
              </div>
            ) : (
              <div className="ceptly-glass-card p-5">
                <p className="ceptly-card-empty mt-0">
                  No individual responses to show for this session yet.
                </p>
              </div>
            )}
          </section>

          <section className="ceptly-section">
            <h2 className="ceptly-section-title">Thread</h2>
            <CheckinTranscriptMessageList
              standupMessages={detail.messages}
              icDisplayName={
                detail.participants[0]?.display_name ?? "Participant"
              }
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
