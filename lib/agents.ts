// Ceptly — Agents: maps the real backend entities (scheduled check-in
// conversations + channel standups) onto the unified "agent" list view.

import type {
  ScheduledConversation,
  ScheduleFrequency,
  Standup,
} from "@/lib/api/types";
import {
  formatScheduleDaysPreview,
  formatScheduleTimePreview,
} from "@/lib/schedule/preview";

export type AgentKind = "conversation" | "standup";

export interface AgentKindDef {
  id: AgentKind;
  name: string;
  desc: string;
}

// The two agent types Ceptly can actually deploy and run.
/** Pretrained DM check-in persona (not used as form defaults). */
export const DAILY_STANDUP_PERSONA =
  "You are Ceptly, a calm, capable chief of staff. You DM each teammate for a short, conversational standup — progress, blockers, and anything they need. One question at a time; stop once the picture is clear.";

/** Pretrained channel-standup persona (not used as form defaults). */
export const CHANNEL_STANDUP_PERSONA =
  "You are Ceptly, a calm, capable chief of staff. You run a short standup in the team's channel — progress, blockers, and what people need. Keep it conversational and focused.";

export function buildStandupCustomInstructions(
  persona: string,
  goal: string,
): string {
  const trimmedPersona = persona.trim();
  const trimmedGoal = goal.trim();
  if (!trimmedGoal) {
    return trimmedPersona;
  }
  return `${trimmedPersona}\n\nGoal: ${trimmedGoal}`;
}

export type PersonaMode = "custom" | "pretrained";

export type PersonaPresetId = "scrum_master";

export type AgentTriggerMode = "schedule" | "event" | "manual";

export const SCHEDULE_PRESET_IDS = [
  "weekdays",
  "mwf",
  "weekly_mon",
  "daily",
] as const;

export type SchedulePresetId = (typeof SCHEDULE_PRESET_IDS)[number];

export interface SchedulePreset {
  id: SchedulePresetId;
  label: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: "weekdays",
    label: "Every weekday",
    frequency: "specific_days",
    days_of_week: [1, 2, 3, 4, 5],
  },
  {
    id: "mwf",
    label: "Mon / Wed / Fri",
    frequency: "specific_days",
    days_of_week: [1, 3, 5],
  },
  {
    id: "weekly_mon",
    label: "Weekly · Mon",
    frequency: "specific_days",
    days_of_week: [1],
  },
  {
    id: "daily",
    label: "Daily",
    frequency: "daily",
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
  },
];

export function schedulePresetFromSchedule(
  frequency: ScheduleFrequency,
  daysOfWeek: number[],
): SchedulePresetId | null {
  const sorted = [...daysOfWeek].sort((a, b) => a - b);
  const key = `${frequency}:${sorted.join(",")}`;
  const match = SCHEDULE_PRESETS.find(
    (p) =>
      `${p.frequency}:${[...p.days_of_week].sort((a, b) => a - b).join(",")}` ===
      key,
  );
  return match?.id ?? null;
}

// ---------------------------------------------------------------------------
// Deploy-an-agent page: the unified agent types a user can deploy. Maps onto the
// `/agents` backend API kinds (checkin | reachout | standup).
// ---------------------------------------------------------------------------
export type DeployAgentType = "checkin" | "reachout" | "standup";

export interface DeployAgentTypeDef {
  id: DeployAgentType;
  name: string;
  desc: string;
  /** lucide icon name */
  icon: string;
}

export const DEPLOY_AGENT_TYPES: DeployAgentTypeDef[] = [
  {
    id: "checkin",
    name: "Scheduled check-in",
    desc: "DMs each teammate on a cadence.",
    icon: "calendar-clock",
  },
  {
    id: "reachout",
    name: "One-off reach-out",
    desc: "A single Slack DM with a goal.",
    icon: "send",
  },
  {
    id: "standup",
    name: "Channel standup",
    desc: "Broadcast or sequential in a channel.",
    icon: "hash",
  },
];

export const AGENT_KINDS: AgentKindDef[] = [
  {
    id: "conversation",
    name: "Scheduled check-in",
    desc: "DMs each teammate on a cadence to capture progress and blockers.",
  },
  {
    id: "standup",
    name: "Channel standup",
    desc: "Runs a broadcast or sequential standup in a chat channel.",
  },
];

export interface AgentSchedule {
  timezone: string;
  frequency: ScheduleFrequency;
  days_of_week: number[];
  time_local: string;
  enabled: boolean;
}

export interface AgentRow {
  id: string;
  kind: AgentKind;
  name: string;
  meta: string;
  live: boolean;
  schedule: AgentSchedule;
  href: string;
}

function scheduleMeta(
  timeLocal: string,
  timezone: string,
  frequency: ScheduleFrequency,
  daysOfWeek: number[],
): string {
  return `${formatScheduleDaysPreview(frequency, daysOfWeek)} · ${formatScheduleTimePreview(
    timeLocal,
    timezone,
  )}`;
}

export function conversationToAgentRow(c: ScheduledConversation): AgentRow {
  const count = c.roster_member_ids?.length ?? 0;
  const audience = count
    ? `${count} ${count === 1 ? "person" : "people"}`
    : "DM";
  return {
    id: c.id,
    kind: "conversation",
    name: c.name,
    meta: `${audience} · ${scheduleMeta(c.time_local, c.timezone, c.frequency, c.days_of_week)}`,
    live: c.enabled,
    schedule: {
      timezone: c.timezone,
      frequency: c.frequency,
      days_of_week: c.days_of_week,
      time_local: c.time_local,
      enabled: c.enabled,
    },
    href: `/activity/${c.id}`,
  };
}

export function standupToAgentRow(s: Standup): AgentRow {
  const channel = s.slack_channel_name
    ? `#${s.slack_channel_name.replace(/^#/, "")}`
    : "channel";
  const style = s.style === "sequential" ? "Sequential" : "Broadcast";
  return {
    id: s.id,
    kind: "standup",
    name: s.name,
    meta: `${style} · ${channel} · ${scheduleMeta(s.time_local, s.timezone, s.frequency, s.days_of_week)}`,
    live: s.enabled,
    schedule: {
      timezone: s.timezone,
      frequency: s.frequency,
      days_of_week: s.days_of_week,
      time_local: s.time_local,
      enabled: s.enabled,
    },
    href: `/settings/standups`,
  };
}
