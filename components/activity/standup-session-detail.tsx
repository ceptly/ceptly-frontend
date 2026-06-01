"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { fetchStandupSessionDetail } from "@/actions/standups";
import { CheckinTranscriptMessageList } from "@/components/activity/checkin-transcript-message-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type {
  StandupSessionDetail,
  StandupSessionSummary,
} from "@/lib/api/types";

interface StandupSessionDetailViewProps {
  workspaceId: string;
  standupId: string;
  sessions: StandupSessionSummary[];
  initialSession: StandupSessionDetail | null;
}

function formatLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sessionLabel(session: StandupSessionSummary): string {
  return `${formatLabel(session.scheduled_fire_at)} (${session.status})`;
}

export function StandupSessionDetailView({
  workspaceId,
  standupId,
  sessions,
  initialSession,
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
  const [open, setOpen] = useState(false);

  const preserveScrollPosition = () => {
    const scrollY = window.scrollY;
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    });
  };

  const handleSelect = async (sessionId: string) => {
    setOpen(false);
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
      <p className="text-sm text-muted-foreground">
        No standup sessions yet.
      </p>
    );
  }

  const selectedSession = sessions.find(
    (session) => session.session_id === selectedSessionId,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="standup-session-select">Session</Label>
        <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                id="standup-session-select"
                type="button"
                variant="outline"
                className="h-9 w-full max-w-md justify-between font-normal"
                disabled={loading}
              />
            }
          >
            <span className="truncate">
              {selectedSession
                ? sessionLabel(selectedSession)
                : "Select a session"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="max-h-64 w-[var(--anchor-width)]"
            finalFocus={false}
          >
            <DropdownMenuRadioGroup
              value={selectedSessionId}
              onValueChange={(value) => void handleSelect(value)}
            >
              {sessions.map((session) => (
                <DropdownMenuRadioItem
                  key={session.session_id}
                  value={session.session_id}
                  closeOnClick
                >
                  {sessionLabel(session)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading session…
        </div>
      ) : detail ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{detail.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatLabel(detail.scheduled_fire_at)}
            </span>
          </div>

          {detail.summary_text ? (
            <div className="rounded-lg border border-border p-4 dark:border-white/10">
              <p className="text-sm font-medium">Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {detail.summary_text}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Thread</h2>
            <CheckinTranscriptMessageList
              standupMessages={detail.messages}
              icDisplayName={
                detail.participants[0]?.display_name ?? "Participant"
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
