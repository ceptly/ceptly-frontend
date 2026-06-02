"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateConversation } from "@/lib/api/conversations";
import { updateStandup } from "@/lib/api/standups";
import {
  deployAgent,
  previewAgent,
  testAgent,
  type AgentDeployBody,
  type DeployedAgent,
} from "@/lib/api/agents";
import { getAccessToken } from "@/lib/auth/server";

const scheduleSchema = z.object({
  timezone: z.string().trim().min(1),
  frequency: z.enum(["daily", "specific_days"]),
  days_of_week: z.array(z.number().int().min(0).max(6)),
  time_local: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  enabled: z.boolean(),
});

const conversationToggleSchema = z.object({
  workspaceId: z.string().uuid(),
  conversationId: z.string().uuid(),
  schedule: scheduleSchema,
});

const standupToggleSchema = z.object({
  workspaceId: z.string().uuid(),
  standupId: z.string().uuid(),
  schedule: scheduleSchema,
});

export async function setConversationAgentEnabled(
  input: z.infer<typeof conversationToggleSchema>,
): Promise<{ error?: string }> {
  const parsed = conversationToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateConversation(
    token,
    parsed.data.workspaceId,
    parsed.data.conversationId,
    { schedule: parsed.data.schedule },
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update the agent." };
  }

  revalidatePath("/agents");
  revalidatePath("/activity");
  return {};
}

export async function setStandupAgentEnabled(
  input: z.infer<typeof standupToggleSchema>,
): Promise<{ error?: string }> {
  const parsed = standupToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await updateStandup(
    token,
    parsed.data.workspaceId,
    parsed.data.standupId,
    { schedule: parsed.data.schedule },
  );

  if (!result.success) {
    return { error: result.error ?? "Failed to update the agent." };
  }

  revalidatePath("/agents");
  revalidatePath("/settings/standups");
  return {};
}

const resultDestinationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("slack_channel"),
    channel_id: z.string().trim().min(1).max(64),
    name: z.string().trim().max(200).optional(),
  }),
  z.object({
    type: z.literal("roster_dm"),
    roster_member_id: z.string().uuid(),
  }),
  z.object({ type: z.literal("workspace_digest") }),
]);

const agentDeploySchema = z.object({
  kind: z.enum(["checkin", "reachout", "standup"]),
  trigger_mode: z.enum(["schedule", "manual", "event"]).optional(),
  name: z.string().trim().min(1).max(100),
  persona_preset: z.enum(["scrum_master"]).optional(),
  agent_persona: z.string().trim().max(4000).optional().nullable(),
  conversation_goal: z.string().trim().max(500).optional().nullable(),
  agent_notes: z.string().trim().max(2000).optional().nullable(),
  intent: z.enum(["gather", "inform"]).optional(),
  roster_member_ids: z.array(z.string().uuid()).min(1).max(20),
  context_integrations: z
    .array(z.enum(["linear", "jira", "monday", "clickup"]))
    .optional(),
  result_destinations: z.array(resultDestinationSchema).max(20).optional(),
  schedule: scheduleSchema,
  channel_id: z.string().trim().min(1).optional(),
  style: z.enum(["broadcast", "sequential"]).optional(),
  template_id: z.string().trim().min(1).optional(),
  topic: z.string().trim().max(200).optional(),
  delivery_facts: z.string().trim().max(4000).optional(),
});

const deployArgsSchema = z.object({
  workspaceId: z.string().uuid(),
  body: agentDeploySchema,
});

async function withToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T | { error: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }
  return fn(token);
}

export async function deployAgentAction(input: {
  workspaceId: string;
  body: AgentDeployBody;
}): Promise<{ error?: string; agent?: DeployedAgent }> {
  const parsed = deployArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return withToken(async (token) => {
    const result = await deployAgent(
      token,
      parsed.data.workspaceId,
      parsed.data.body as AgentDeployBody,
    );
    if (!result.success || !result.data) {
      return { error: result.error ?? "Failed to deploy the agent." };
    }
    revalidatePath("/agents");
    revalidatePath("/activity");
    revalidatePath("/settings/standups");
    return { agent: result.data };
  });
}

export async function previewAgentAction(input: {
  workspaceId: string;
  body: AgentDeployBody;
}): Promise<{ error?: string; opener?: string }> {
  const parsed = deployArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return withToken(async (token) => {
    const result = await previewAgent(
      token,
      parsed.data.workspaceId,
      parsed.data.body as AgentDeployBody,
    );
    if (!result.success || !result.data) {
      return { error: result.error ?? "Could not generate a preview." };
    }
    return { opener: result.data.opener };
  });
}

export async function testAgentAction(input: {
  workspaceId: string;
  body: AgentDeployBody;
}): Promise<{ error?: string; sessionsStarted?: number }> {
  const parsed = deployArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return withToken(async (token) => {
    const result = await testAgent(
      token,
      parsed.data.workspaceId,
      parsed.data.body as AgentDeployBody,
    );
    if (!result.success || !result.data) {
      return { error: result.error ?? "Could not start the test run." };
    }
    return { sessionsStarted: result.data.sessionsStarted };
  });
}
