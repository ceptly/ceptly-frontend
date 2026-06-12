// Ceptly — Agents: maps the real backend entities (scheduled check-in
// conversations + channel standups) onto the unified "agent" list view.

import type {
  ScheduledConversation,
  ScheduleFrequency,
  Standup,
  StandupStyle,
} from "@/lib/api/types";
import {
  formatScheduleDaysPreview,
  formatScheduleTimePreview,
} from "@/lib/schedule/preview";
import { parseResultDestinations } from "@/lib/result-destinations";

export type AgentKind = "conversation" | "standup";

export interface AgentKindDef {
  id: AgentKind;
  name: string;
  desc: string;
}

// Persona preset prompts live in the backend registry (GET /api/personas);
// the frontend never hardcodes them.

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

/** Persona preset ids come from the backend registry (GET /api/personas). */
export type PersonaPresetId = string;

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

// ---------------------------------------------------------------------------
// Edit mode: prefill the deploy form (AgentDeployFields) from an existing
// agent so editing reuses the exact same form as /agents/new.
// ---------------------------------------------------------------------------

/** Mirrors the deploy form's internal state for prefilling edit mode. */
export interface AgentDeployInitialValues {
  type: DeployAgentType;
  personaMode: PersonaMode;
  /** Pretrained persona preset id (e.g. "scrum_master"); defaults to the first available. */
  presetId?: string;
  persona: string;
  goal: string;
  notes: string;
  name: string;
  standupStyle: StandupStyle;
  standupChannelId: string;
  timezone: string;
  frequency: ScheduleFrequency;
  daysOfWeek: number[];
  timeLocal: string;
  triggerMode: AgentTriggerMode;
  selectedMemberIds: string[];
  selectedChannelIds: string[];
  selectedRosterDmIds: string[];
  contextIntegrations: string[];
}

/** Identifies the existing agent being edited so saves hit the right record. */
export interface AgentEditTarget {
  id: string;
  kind: AgentKind;
}

export function conversationToInitialValues(
  c: ScheduledConversation,
): AgentDeployInitialValues {
  const destinations = parseResultDestinations(c.result_destinations);
  const persona = c.agent_persona ?? "";
  return {
    type: "checkin",
    // Default to "custom" so the stored persona/goal are shown and editable; a
    // save only switches to the preset if the user picks it explicitly.
    personaMode: persona ? "custom" : "pretrained",
    persona,
    goal: c.conversation_goal ?? "",
    notes: c.agent_notes ?? "",
    name: c.name,
    standupStyle: "broadcast",
    standupChannelId: "",
    timezone: c.timezone,
    frequency: c.frequency,
    daysOfWeek: c.days_of_week,
    timeLocal: c.time_local,
    triggerMode: "schedule",
    selectedMemberIds: c.roster_member_ids ?? [],
    selectedChannelIds: destinations.channelIds,
    selectedRosterDmIds: destinations.rosterDmIds,
    contextIntegrations: c.context_integrations ?? [],
  };
}

export function standupToInitialValues(s: Standup): AgentDeployInitialValues {
  const destinations = parseResultDestinations(s.result_destinations);
  const customInstructions = s.custom_instructions?.trim() ?? "";
  return {
    type: "standup",
    personaMode: customInstructions ? "custom" : "pretrained",
    // custom_instructions bundles persona + goal; surface it as the persona.
    persona: customInstructions,
    goal: "",
    notes: s.agent_notes ?? "",
    name: s.name,
    standupStyle: s.style,
    standupChannelId: s.slack_channel_id,
    timezone: s.timezone,
    frequency: s.frequency,
    daysOfWeek: s.days_of_week,
    timeLocal: s.time_local,
    triggerMode: "schedule",
    selectedMemberIds: s.members.map((m) => m.roster_member_id),
    selectedChannelIds: destinations.channelIds,
    selectedRosterDmIds: destinations.rosterDmIds,
    contextIntegrations: s.context_integrations ?? [],
  };
}

export function standupAgentHref(standupId: string, edit = false): string {
  const base = `/agents/${standupId}`;
  return edit ? `${base}?edit=1` : base;
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
    href: standupAgentHref(s.id),
  };
}
