"use client";

import { ArrowRight, Hash, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChannelStandupProposal } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import { cn } from "@/lib/utils";

interface ChannelStandupProposalCardProps {
  proposal: ChannelStandupProposal;
  onSave: () => void;
  pending?: boolean;
  disabled?: boolean;
}

function styleLabel(style: ChannelStandupProposal["style"]): string {
  return style === "broadcast" ? "Broadcast (all at once)" : "Sequential (one at a time)";
}

function formatMemberNames(members: ChannelStandupProposal["members"]): string {
  return members.map((member) => member.display_name).join(", ");
}

export function ChannelStandupProposalCard({
  proposal,
  onSave,
  pending = false,
  disabled = false,
}: ChannelStandupProposalCardProps) {
  const channelLabel = proposal.slack_channel_name
    ? `#${proposal.slack_channel_name}`
    : proposal.slack_channel_id;
  const schedulePreview = formatSchedulePreview(
    proposal.schedule.time_local,
    proposal.schedule.timezone,
    proposal.schedule.frequency,
    proposal.schedule.days_of_week,
    proposal.schedule.enabled,
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-4",
        "border-[#56FF3C]/30 bg-[#E6F9E6]/70",
        "dark:border-[#56FF3C]/40 dark:bg-[#56FF3C]/10",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Hash className="size-3.5 shrink-0" aria-hidden="true" />
        Channel standup · Slack
      </div>

      <p className="text-sm font-medium">{proposal.name}</p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Channel:</span> {channelLabel}
      </p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Participants:</span>{" "}
        {formatMemberNames(proposal.members)}
      </p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Style:</span> {styleLabel(proposal.style)}
      </p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Schedule:</span> {schedulePreview}
      </p>

      {proposal.custom_instructions.trim() ? (
        <p className="mt-2 text-sm leading-relaxed">
          <span className="font-medium">Instructions:</span>{" "}
          {proposal.custom_instructions}
        </p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {proposal.summary}
      </p>

      <Button
        className="mt-4 gap-2"
        size="sm"
        onClick={onSave}
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            {proposal.standup_id ? "Update standup" : "Save standup"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}
