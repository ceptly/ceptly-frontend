"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

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
import {
  memberInitials,
  memberResponseNote,
} from "@/lib/activity/conversation-detail";
import { formatActivityLatestLabel } from "@/lib/activity/rollup-card";
import type {
  ConversationRunDetail,
  ConversationRunSummary,
} from "@/lib/api/types";

interface ConversationResultsViewProps {
  conversationName: string;
  conversationSubtitle: string;
  runs: ConversationRunSummary[];
  initialRun: ConversationRunDetail | null;
  rollupSummary?: string | null;
  onSelectRun: (runId: string) => Promise<ConversationRunDetail | null>;
}

function formatRunPickerLabel(run: ConversationRunSummary): string {
  return formatActivityLatestLabel(run.fired_at);
}

function RunPicker({
  runs,
  selectedRunId,
  loading,
  onSelect,
}: {
  runs: ConversationRunSummary[];
  selectedRunId: string;
  loading: boolean;
  onSelect: (runId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedRun = runs.find((run) => run.run_id === selectedRunId);

  const handleSelect = (runId: string) => {
    setOpen(false);
    onSelect(runId);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
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
          {selectedRun
            ? formatRunPickerLabel(selectedRun)
            : "Select session"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[268px]"
        finalFocus={false}
      >
        <DropdownMenuLabel className="px-2 pb-1 text-[11px] font-semibold tracking-[0.05em] uppercase">
          Past sessions
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={selectedRunId}
          onValueChange={handleSelect}
        >
          {runs.map((run) => (
            <DropdownMenuRadioItem
              key={run.run_id}
              value={run.run_id}
              closeOnClick
              className="items-start py-2"
            >
              <span className="min-w-0">
                <span className="block font-medium">
                  {formatRunPickerLabel(run)}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                  {run.responded_count}/{run.expected_count} responded
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

function buildResponseRows(runDetail: ConversationRunDetail) {
  const respondedById = new Map(
    runDetail.responded.map((member) => [member.roster_member_id, member]),
  );
  const members: Array<{
    key: string;
    name: string;
    note: string | null;
    responded: boolean;
  }> = [];

  for (const member of runDetail.expected_members) {
    const respondedMember = respondedById.get(member.roster_member_id);
    members.push({
      key: member.roster_member_id,
      name: member.display_name,
      note: respondedMember ? memberResponseNote(respondedMember) : null,
      responded: Boolean(respondedMember),
    });
  }

  for (const member of runDetail.not_responded) {
    if (members.some((row) => row.key === member.roster_member_id)) {
      continue;
    }
    members.push({
      key: member.roster_member_id,
      name: member.display_name,
      note: null,
      responded: false,
    });
  }

  return members;
}

export function ConversationResultsView({
  conversationName,
  conversationSubtitle,
  runs,
  initialRun,
  rollupSummary = null,
  onSelectRun,
}: ConversationResultsViewProps) {
  const [selectedRunId, setSelectedRunId] = useState(
    initialRun?.run_id ?? runs[0]?.run_id ?? "",
  );
  const [runDetail, setRunDetail] = useState<ConversationRunDetail | null>(
    initialRun,
  );
  const [loading, setLoading] = useState(false);

  const selectedSummary = useMemo(
    () => runs.find((run) => run.run_id === selectedRunId),
    [runs, selectedRunId],
  );

  const handleRunChange = async (runId: string) => {
    const scrollY = window.scrollY;
    setSelectedRunId(runId);
    if (runId === runDetail?.run_id) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      });
      return;
    }
    setLoading(true);
    const detail = await onSelectRun(runId);
    setRunDetail(detail);
    setLoading(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    });
  };

  const respondedCount = selectedSummary?.responded_count ?? 0;
  const expectedCount = selectedSummary?.expected_count ?? 0;
  const completionPercent =
    expectedCount > 0
      ? Math.round((respondedCount / expectedCount) * 100)
      : 0;
  const waitingCount = Math.max(expectedCount - respondedCount, 0);
  const responseRows = runDetail ? buildResponseRows(runDetail) : [];

  return (
    <>
      <div className="ceptly-page-head ceptly-page-head-split">
        <div>
          <h1 className="ceptly-page-title">{conversationName}</h1>
          <p className="ceptly-page-sub">{conversationSubtitle}</p>
        </div>
        {runs.length > 0 ? (
          <RunPicker
            runs={runs}
            selectedRunId={selectedRunId}
            loading={loading}
            onSelect={(runId) => void handleRunChange(runId)}
          />
        ) : null}
      </div>

      {runs.length === 0 ? (
        <p className="ceptly-card-empty mt-0">
          No check-in runs yet. When the schedule fires, responses will appear
          here.
        </p>
      ) : loading || !runDetail ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {loading ? "Loading session…" : "Select a session to view results."}
        </div>
      ) : (
        <div className="space-y-0">
          <div className="ceptly-stat-grid">
            <div className="ceptly-stat">
              <div className="ceptly-stat-val">
                {respondedCount}/{expectedCount}
              </div>
              <div className="ceptly-stat-label">Responded</div>
            </div>
            <div className="ceptly-stat">
              <div className="ceptly-stat-val">{completionPercent}%</div>
              <div className="ceptly-stat-label">Completion</div>
            </div>
            <div className="ceptly-stat">
              <div className="ceptly-stat-val">{waitingCount}</div>
              <div className="ceptly-stat-label">Still waiting</div>
            </div>
          </div>

          {rollupSummary ? (
            <section className="ceptly-section">
              <h2 className="ceptly-section-title">
                <Sparkles className="text-brand" aria-hidden />
                Rollup summary
              </h2>
              <div className="ceptly-glass-card p-[18px]">
                <p className="text-sm leading-[1.6] whitespace-pre-wrap">
                  {rollupSummary}
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
        </div>
      )}
    </>
  );
}
