import type { ScheduleFrequency, ChannelStyle } from "@/lib/api/types";
import { parseResultDestinations } from "@/lib/result-destinations";

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

/** Mirrors the deploy form's internal state for prefilling edit mode. */
export interface AgentDeployInitialValues {
  /** "channel" = runs in a Slack/Teams channel (meeting); "dm" = DMs each participant (conversation). */
  destinationType: "channel" | "dm";
  personaMode: PersonaMode;
  /** Pretrained persona preset id (e.g. "scrum_master"); defaults to the first available. */
  presetId?: string;
  persona: string;
  goal: string;
  notes: string;
  name: string;
  channelStyle: ChannelStyle;
  channelId: string;
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
}

export function agentHref(agentId: string, edit = false): string {
  const base = `/agents/${agentId}`;
  return edit ? `${base}?edit=1` : base;
}

export function agentToInitialValues(
  a: import("@/lib/api/agents").AgentFull,
): AgentDeployInitialValues {
  const destinations = parseResultDestinations(a.result_destinations);
  const hasPreset = Boolean(a.persona_preset);
  return {
    destinationType: a.destination === "channel" ? "channel" : "dm",
    personaMode: hasPreset ? "pretrained" : "custom",
    presetId: a.persona_preset ?? undefined,
    persona: a.agent_persona ?? "",
    goal: a.conversation_goal ?? "",
    notes: a.agent_notes ?? "",
    name: a.name,
    channelStyle: a.style ?? "broadcast",
    channelId: a.channel_id ?? "",
    timezone: a.timezone,
    frequency: a.frequency,
    daysOfWeek: a.days_of_week,
    timeLocal: a.time_local,
    triggerMode: a.trigger === "one_off" ? "manual" : "schedule",
    selectedMemberIds: a.roster_member_ids,
    selectedChannelIds: destinations.channelIds,
    selectedRosterDmIds: destinations.rosterDmIds,
    contextIntegrations: a.context_integrations,
  };
}
