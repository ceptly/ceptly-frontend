import { describe, expect, it } from "vitest";

import type { AgentDeployInitialValues } from "@/lib/agents";
import {
  agentFormValuesToInitialValues,
  initialValuesToAgentFormValues,
} from "@/lib/chat-agent-form";

/**
 * The /chat agent-setup card renders the exact agents/new form, prefilled by
 * the agent (snake_case AgentFormValues) and edited by the user (camelCase
 * AgentDeployInitialValues). These translators are the contract between the two
 * representations — a regression here silently corrupts deployed agents.
 */

const WORKSPACE_TZ = "America/Chicago";
const APP_CONTEXT = [
  { id: "linear", label: "Linear", selectable: true },
] as Parameters<typeof agentFormValuesToInitialValues>[2];

describe("agentFormValuesToInitialValues", () => {
  it("maps a pretrained-persona channel agent and snake->camel keys", () => {
    const result = agentFormValuesToInitialValues(
      {
        destination: "channel",
        persona_preset: "scrum_master",
        channel_id: "C123",
        roster_member_ids: ["m1", "m2"],
        time_local: "10:30",
        trigger: "scheduled",
      },
      WORKSPACE_TZ,
      APP_CONTEXT,
    );

    expect(result).toMatchObject({
      destinationType: "channel",
      personaMode: "pretrained",
      presetId: "scrum_master",
      channelId: "C123",
      selectedMemberIds: ["m1", "m2"],
      timeLocal: "10:30",
      triggerMode: "schedule",
    });
  });

  it("treats a non-empty persona as a custom persona", () => {
    const result = agentFormValuesToInitialValues(
      { destination: "dm", persona: "You are a kind coach" },
      WORKSPACE_TZ,
      APP_CONTEXT,
    );
    expect(result.personaMode).toBe("custom");
    expect(result.persona).toBe("You are a kind coach");
  });

  it("falls back to the workspace timezone and sensible defaults", () => {
    const result = agentFormValuesToInitialValues(
      { destination: "dm" },
      WORKSPACE_TZ,
      APP_CONTEXT,
    );
    expect(result.timezone).toBe(WORKSPACE_TZ);
    expect(result.frequency).toBe("specific_days");
    expect(result.timeLocal).toBe("09:00");
    // Linear is selectable, so it is pre-attached as default context.
    expect(result.contextIntegrations).toEqual(["linear"]);
  });
});

describe("round-trip: initialValues -> formValues -> initialValues", () => {
  it("preserves the meaningful fields a user edited", () => {
    const original: AgentDeployInitialValues = {
      destinationType: "channel",
      runtime: "live",
      personaMode: "pretrained",
      presetId: "scrum_master",
      persona: "",
      goal: "",
      notes: "Daily standup",
      name: "Standup Bot",
      channelStyle: "broadcast",
      channelId: "C999",
      timezone: "Europe/London",
      frequency: "specific_days",
      daysOfWeek: [1, 3, 5],
      timeLocal: "08:15",
      triggerMode: "schedule",
      selectedMemberIds: ["u1"],
      selectedChannelIds: ["C1"],
      selectedRosterDmIds: ["d1"],
      contextIntegrations: ["linear"],
    };

    const roundTripped = agentFormValuesToInitialValues(
      initialValuesToAgentFormValues(original),
      WORKSPACE_TZ,
      APP_CONTEXT,
    );

    expect(roundTripped).toMatchObject({
      destinationType: "channel",
      personaMode: "pretrained",
      presetId: "scrum_master",
      name: "Standup Bot",
      notes: "Daily standup",
      channelId: "C999",
      timezone: "Europe/London",
      daysOfWeek: [1, 3, 5],
      timeLocal: "08:15",
      triggerMode: "schedule",
      selectedMemberIds: ["u1"],
      selectedChannelIds: ["C1"],
      selectedRosterDmIds: ["d1"],
      contextIntegrations: ["linear"],
    });
  });

  it("maps a manual trigger to one_off and back to manual", () => {
    const formValues = initialValuesToAgentFormValues({
      destinationType: "dm",
      runtime: "live",
      personaMode: "custom",
      persona: "Be concise",
      goal: "Unblock the team",
      notes: "",
      name: "",
      channelStyle: "broadcast",
      channelId: "",
      timezone: "UTC",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5],
      timeLocal: "09:00",
      triggerMode: "manual",
      selectedMemberIds: [],
      selectedChannelIds: [],
      selectedRosterDmIds: [],
      contextIntegrations: [],
    });

    expect(formValues.trigger).toBe("one_off");
    expect(formValues.persona).toBe("Be concise");
    expect(formValues.goal).toBe("Unblock the team");

    const back = agentFormValuesToInitialValues(
      formValues,
      WORKSPACE_TZ,
      APP_CONTEXT,
    );
    expect(back.triggerMode).toBe("manual");
    expect(back.personaMode).toBe("custom");
  });
});
