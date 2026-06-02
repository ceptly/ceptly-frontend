"use client";

import {
  CalendarClock,
  GitBranch,
  Hash,
  ListChecks,
  Send,
  Target,
  Users,
  Zap,
} from "lucide-react";

import type { DeployAgentType } from "@/lib/agents";

interface ConfigSummaryProps {
  kind: DeployAgentType;
  typeName: string;
  goal: string;
  audience: string;
  channel: string;
  trigger: string;
  isEvent?: boolean;
}

const TYPE_ICON = {
  checkin: CalendarClock,
  reachout: Send,
  standup: Hash,
} as const;

export function ConfigSummary({
  kind,
  typeName,
  goal,
  audience,
  channel,
  trigger,
  isEvent,
}: ConfigSummaryProps) {
  const TypeIcon = TYPE_ICON[kind];
  const AudienceIcon = kind === "standup" ? Hash : Users;
  const TriggerIcon = isEvent ? Zap : CalendarClock;

  const rows: { Icon: typeof Target; k: string; v: string }[] = [
    { Icon: TypeIcon, k: "Type", v: typeName },
    { Icon: Target, k: "Goal", v: goal || "—" },
    { Icon: AudienceIcon, k: "Audience", v: audience },
    { Icon: GitBranch, k: "Channel", v: channel },
    { Icon: TriggerIcon, k: "Trigger", v: trigger },
  ];

  return (
    <div className="ag-preview">
      <div className="ag-preview-head">
        <ListChecks className="size-[13px]" /> Summary
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
