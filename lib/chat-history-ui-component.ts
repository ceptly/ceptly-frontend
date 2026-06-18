import type { AgentFormValues, SetupChatUiComponent } from "@/lib/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Narrow JSONB proposal.ui_component from chat history rows. Returns undefined
 * when the shape is missing or unrecognized so renderers never see bad data.
 */
export function parseStoredUiComponent(
  raw: unknown,
): SetupChatUiComponent | undefined {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    return undefined;
  }

  switch (raw.type) {
    case "agent_deployed":
      return {
        type: "agent_deployed",
        ...(typeof raw.name === "string" ? { name: raw.name } : {}),
      };
    case "agent_form":
      if (!isRecord(raw.values)) {
        return undefined;
      }
      return {
        type: "agent_form",
        values: raw.values as AgentFormValues,
      };
    case "day_picker":
      if (!Array.isArray(raw.days_of_week)) {
        return undefined;
      }
      return {
        type: "day_picker",
        days_of_week: raw.days_of_week.filter(
          (day): day is number => typeof day === "number",
        ),
        ...(typeof raw.resolved === "boolean" ? { resolved: raw.resolved } : {}),
      };
    case "member_picker":
      if (
        !Array.isArray(raw.members) ||
        !Array.isArray(raw.selected_member_ids)
      ) {
        return undefined;
      }
      return {
        type: "member_picker",
        members: raw.members.filter(isRecord).map((member) => ({
          id: String(member.id ?? ""),
          display_name: String(member.display_name ?? ""),
          email: String(member.email ?? ""),
        })),
        selected_member_ids: raw.selected_member_ids.filter(
          (id): id is string => typeof id === "string",
        ),
      };
    case "setup_recap":
      if (
        !Array.isArray(raw.days_of_week) ||
        !Array.isArray(raw.members) ||
        !Array.isArray(raw.selected_member_ids) ||
        !Array.isArray(raw.selected_context_integrations) ||
        !Array.isArray(raw.selected_channel_ids) ||
        !Array.isArray(raw.selected_roster_dm_ids)
      ) {
        return undefined;
      }
      return {
        type: "setup_recap",
        days_of_week: raw.days_of_week.filter(
          (day): day is number => typeof day === "number",
        ),
        members: raw.members.filter(isRecord).map((member) => ({
          id: String(member.id ?? ""),
          display_name: String(member.display_name ?? ""),
          email: String(member.email ?? ""),
        })),
        selected_member_ids: raw.selected_member_ids.filter(
          (id): id is string => typeof id === "string",
        ),
        selected_context_integrations:
          raw.selected_context_integrations.filter(
            (id): id is string => typeof id === "string",
          ),
        selected_channel_ids: raw.selected_channel_ids.filter(
          (id): id is string => typeof id === "string",
        ),
        selected_roster_dm_ids: raw.selected_roster_dm_ids.filter(
          (id): id is string => typeof id === "string",
        ),
      };
    default:
      return undefined;
  }
}
