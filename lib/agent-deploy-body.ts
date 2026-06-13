// Single source of truth for turning the deploy form's state
// (AgentDeployInitialValues) into the backend deploy payload (AgentDeployBody).
// Used by both the full AgentDeployFields form and the inline chat deploy card,
// so the two can never drift on how a meeting agent is built.

import { SCHEDULE_PRESETS, type AgentDeployInitialValues } from "@/lib/agents";
import type {
  AgentContextIntegration,
  AgentDeployBody,
} from "@/lib/api/agents";
import type { SlackChannel } from "@/lib/api/slack-channels";
import { buildResultDestinations } from "@/lib/result-destinations";
import { snapScheduleTimeToInterval } from "@/lib/schedule/cron-fire";

export interface DeployBodyContext {
  /** Channels used as the standup venue and for channel rollups. */
  chatChannels: SlackChannel[];
  /** Channels available for DM-agent rollups. */
  slackChannels: SlackChannel[];
}

/** The required fields a meeting agent needs before it can deploy. */
export function agentDeployValuesComplete(
  values: AgentDeployInitialValues,
): boolean {
  const isChannelDest = values.destinationType === "channel";
  const isManual = values.triggerMode === "manual";
  if (!values.name.trim()) return false;
  if (isChannelDest && !values.standupChannelId) return false;
  if (values.selectedMemberIds.length === 0) return false;
  if (
    !isManual &&
    values.frequency === "specific_days" &&
    values.daysOfWeek.length === 0
  ) {
    return false;
  }
  return true;
}

function buildDeploySchedule(values: AgentDeployInitialValues) {
  if (values.triggerMode === "manual") {
    return {
      timezone: values.timezone,
      frequency: "specific_days" as const,
      days_of_week: SCHEDULE_PRESETS[0]?.days_of_week ?? [1, 2, 3, 4, 5],
      time_local: "09:00",
      enabled: false,
    };
  }
  return {
    timezone: values.timezone,
    frequency: values.frequency,
    days_of_week:
      values.frequency === "daily"
        ? [0, 1, 2, 3, 4, 5, 6]
        : values.daysOfWeek,
    time_local: snapScheduleTimeToInterval(values.timeLocal),
    enabled: true,
  };
}

/** Form state plus the API payload — useful for copying into AI debug prompts. */
export interface AgentDeployDebugSnapshot {
  form: AgentDeployInitialValues;
  deployBody: AgentDeployBody;
}

export function buildAgentDeployDebugSnapshot(
  values: AgentDeployInitialValues,
  ctx: DeployBodyContext,
): AgentDeployDebugSnapshot {
  return {
    form: values,
    deployBody: buildAgentDeployBody(values, ctx),
  };
}

export function buildAgentDeployBody(
  values: AgentDeployInitialValues,
  ctx: DeployBodyContext,
): AgentDeployBody {
  const isChannelDest = values.destinationType === "channel";
  const isPretrained = values.personaMode === "pretrained";
  const rollupChannels = isChannelDest ? ctx.chatChannels : ctx.slackChannels;

  return {
    kind: isChannelDest ? "standup" : "checkin",
    trigger_mode: values.triggerMode,
    name: values.name.trim(),
    ...(isPretrained
      ? { persona_preset: values.presetId }
      : {
          agent_persona: values.persona.trim(),
          conversation_goal: values.goal.trim(),
        }),
    agent_notes: values.notes.trim() || undefined,
    intent: "gather",
    roster_member_ids: values.selectedMemberIds,
    context_integrations:
      values.contextIntegrations as AgentContextIntegration[],
    result_destinations: buildResultDestinations({
      channelIds: values.selectedChannelIds,
      channels: rollupChannels,
      rosterDmIds: values.selectedRosterDmIds,
    }),
    schedule: buildDeploySchedule(values),
    ...(isChannelDest
      ? { channel_id: values.standupChannelId, style: values.standupStyle }
      : {}),
  };
}
