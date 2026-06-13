"use client";

import { FlaskConical, Loader2, Rocket, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { agentDeployValuesComplete } from "@/lib/agent-deploy-body";
import type { AgentDeployInitialValues } from "@/lib/agents";
import type { ChatChannel } from "@/lib/api/communication";
import {
  formatScheduleDaysPreview,
  formatScheduleTimePreview,
} from "@/lib/schedule/preview";

interface AgentDeployProposalCardProps {
  values: AgentDeployInitialValues;
  chatChannels: ChatChannel[];
  /** Deploy in flight. */
  pending?: boolean;
  /** Test run in flight. */
  testing?: boolean;
  /** Externally disable (e.g. while a chat turn is streaming). */
  disabled?: boolean;
  onDeploy: () => void;
  onTest?: () => void;
  /** Opens the full config form for fine-grained edits. */
  onEdit?: () => void;
}

function kindLabel(values: AgentDeployInitialValues): string {
  if (values.destinationType === "channel") return "Channel standup";
  if (values.triggerMode === "manual") return "One-off reach-out";
  return "Direct check-in";
}

function destinationLabel(
  values: AgentDeployInitialValues,
  chatChannels: ChatChannel[],
): string {
  if (values.destinationType !== "channel") return "Direct messages";
  const channel = chatChannels.find((c) => c.id === values.standupChannelId);
  if (!channel) return "Channel not set";
  return `#${channel.name.replace(/^#/, "")}`;
}

function scheduleLabel(values: AgentDeployInitialValues): string {
  if (values.triggerMode === "manual") return "Runs once when deployed";
  if (values.triggerMode === "event") return "On an event";
  return `${formatScheduleDaysPreview(
    values.frequency,
    values.daysOfWeek,
  )} · ${formatScheduleTimePreview(values.timeLocal, values.timezone)}`;
}

/** Short phrase for the single most important missing required field. */
function missingLabel(values: AgentDeployInitialValues): string | null {
  if (values.destinationType === "channel" && !values.standupChannelId) {
    return "the channel";
  }
  if (values.selectedMemberIds.length === 0) {
    return values.destinationType === "channel"
      ? "participants"
      : "recipients";
  }
  if (values.triggerMode === "schedule") {
    if (!values.timeLocal) return "a time";
    if (values.frequency === "specific_days" && values.daysOfWeek.length === 0) {
      return "the days";
    }
  }
  if (!values.name.trim()) return "a name";
  return null;
}

export function AgentDeployProposalCard({
  values,
  chatChannels,
  pending = false,
  testing = false,
  disabled = false,
  onDeploy,
  onTest,
  onEdit,
}: AgentDeployProposalCardProps) {
  const complete = agentDeployValuesComplete(values);
  const missing = complete ? null : missingLabel(values);
  const memberCount = values.selectedMemberIds.length;
  const audience = `${memberCount} ${memberCount === 1 ? "person" : "people"}`;
  const busy = pending || testing || disabled;

  return (
    <div className="ceptly-proposal-card">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Rocket className="size-3.5 shrink-0" aria-hidden="true" />
        Deploy agent · {kindLabel(values)}
      </div>

      <p className="text-sm font-medium">
        {values.name.trim() || "Untitled agent"}
      </p>

      <p className="mt-2 text-sm">
        <span className="font-medium">Destination:</span>{" "}
        {destinationLabel(values, chatChannels)}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">Participants:</span> {audience}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">Schedule:</span> {scheduleLabel(values)}
      </p>

      {missing ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Still needs {missing} — tell me here, or open the config to finish.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-2"
          onClick={onDeploy}
          disabled={!complete || busy}
          title={complete ? undefined : "Add the missing details to deploy"}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Deploying…
            </>
          ) : (
            <>
              <Rocket className="size-4" aria-hidden="true" />
              Deploy agent
            </>
          )}
        </Button>
        {onTest ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={onTest}
            disabled={!complete || busy}
            title={
              complete
                ? "Run this agent once, right now"
                : "Add the missing details to test"
            }
          >
            {testing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Testing…
              </>
            ) : (
              <>
                <FlaskConical className="size-4" aria-hidden="true" />
                Test
              </>
            )}
          </Button>
        ) : null}
        {onEdit ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground"
            onClick={onEdit}
            disabled={pending}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Edit details
          </Button>
        ) : null}
      </div>
    </div>
  );
}
