"use client";

import {
  CalendarClock,
  Check,
  ClipboardCopy,
  GitBranch,
  Hash,
  ListChecks,
  MessageSquare,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfigSummaryProps {
  destinationType: "channel" | "dm";
  destination: string;
  goal: string;
  audience: string;
  channel: string;
  trigger: string;
  isEvent?: boolean;
  onCopyConfig?: () => void;
  configCopied?: boolean;
}

export function ConfigSummary({
  destinationType,
  destination,
  goal,
  audience,
  channel,
  trigger,
  isEvent,
  onCopyConfig,
  configCopied = false,
}: ConfigSummaryProps) {
  const DestinationIcon = destinationType === "channel" ? Hash : MessageSquare;
  const AudienceIcon = Users;
  const TriggerIcon = isEvent ? Zap : CalendarClock;

  const rows: { Icon: typeof Target; k: string; v: string }[] = [
    { Icon: AudienceIcon, k: "Audience", v: audience },
    { Icon: DestinationIcon, k: "Destination", v: destination },
    { Icon: Target, k: "Goal", v: goal || "—" },
    { Icon: GitBranch, k: "Rollup to", v: channel },
    { Icon: TriggerIcon, k: "Trigger", v: trigger },
  ];

  return (
    <div className="ag-preview">
      <div className="ag-preview-head">
        <span className="ag-preview-head-title">
          <ListChecks className="size-[13px]" /> Summary
        </span>
        {onCopyConfig ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onCopyConfig}
            title="Copy deploy config as JSON"
            aria-label="Copy deploy config as JSON"
          >
            {configCopied ? (
              <Check className="size-3.5" />
            ) : (
              <ClipboardCopy className="size-3.5" />
            )}
          </Button>
        ) : null}
      </div>
      <div className="ag-summary">
        {rows.map(({ Icon, k, v }) => (
          <div className="ag-sum-row" key={k}>
            <Icon className="size-[14px]" />
            <span className="ag-sum-k">{k}</span>
            <span className="ag-sum-v">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
