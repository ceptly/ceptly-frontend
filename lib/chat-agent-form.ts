// Bridges the chat agent's snake_case form payload (AgentFormValues) and the
// deploy form's camelCase state (AgentDeployInitialValues) so /chat can render
// the exact agents/new form, prefilled by the agent and editable by the user.

import type { AgentDeployInitialValues } from "@/lib/agents";
import type { AgentFormValues, AppContextOption } from "@/lib/api/types";

function defaultContextIntegrations(options: AppContextOption[]): string[] {
  const linear = options.find((item) => item.id === "linear");
  return linear?.selectable ? ["linear"] : [];
}

export function agentFormValuesToInitialValues(
  values: AgentFormValues,
  workspaceTimezone: string,
  appContextOptions: AppContextOption[],
): AgentDeployInitialValues {
  const hasCustomPersona = Boolean(values.persona?.trim());
  return {
    destinationType: values.kind === "standup" ? "channel" : "dm",
    personaMode: hasCustomPersona ? "custom" : "pretrained",
    presetId: values.persona_preset,
    persona: values.persona ?? "",
    goal: values.goal ?? "",
    notes: values.notes ?? "",
    name: values.name ?? "",
    standupStyle: values.standup_style ?? "broadcast",
    standupChannelId: values.standup_channel_id ?? "",
    timezone: values.timezone ?? workspaceTimezone,
    frequency: values.frequency ?? "specific_days",
    daysOfWeek: values.days_of_week ?? [1, 2, 3, 4, 5],
    timeLocal: values.time_local ?? "09:00",
    triggerMode: values.trigger_mode ?? "schedule",
    selectedMemberIds: values.roster_member_ids ?? [],
    selectedChannelIds: values.result_channel_ids ?? [],
    selectedRosterDmIds: values.result_roster_dm_ids ?? [],
    contextIntegrations:
      values.context_integrations ??
      defaultContextIntegrations(appContextOptions),
  };
}

export function initialValuesToAgentFormValues(
  values: AgentDeployInitialValues,
): AgentFormValues {
  return {
    kind: values.destinationType === "channel" ? "standup" : "checkin",
    ...(values.name.trim() ? { name: values.name.trim() } : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    ...(values.personaMode === "custom"
      ? {
          ...(values.persona.trim() ? { persona: values.persona.trim() } : {}),
          ...(values.goal.trim() ? { goal: values.goal.trim() } : {}),
        }
      : values.presetId
        ? { persona_preset: values.presetId }
        : {}),
    standup_style: values.standupStyle,
    ...(values.standupChannelId
      ? { standup_channel_id: values.standupChannelId }
      : {}),
    timezone: values.timezone,
    frequency: values.frequency,
    days_of_week: values.daysOfWeek,
    time_local: values.timeLocal,
    trigger_mode: values.triggerMode,
    roster_member_ids: values.selectedMemberIds,
    result_channel_ids: values.selectedChannelIds,
    result_roster_dm_ids: values.selectedRosterDmIds,
    context_integrations: values.contextIntegrations,
  };
}
