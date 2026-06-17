"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPostHogClient } from "@/lib/posthog-server";
import { getCurrentUser } from "@/lib/auth/server";

import {
  deployAgent,
  previewAgent,
  testAgent,
  updateAgent,
  setAgentEnabled,
  deleteAgent,
  getAgentSessionDetail,
  type AgentDeployBody,
  type AgentSessionDetail,
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
  destination: z.enum(["dm", "channel"]),
  trigger: z.enum(["scheduled", "one_off"]).optional(),
  runtime: z.enum(["live", "playground"]).optional(),
  name: z.string().trim().min(1).max(100),
  persona_preset: z.string().trim().min(1).max(50).optional(),
  agent_persona: z.string().trim().max(4000).optional().nullable(),
  conversation_goal: z.string().trim().max(500).optional().nullable(),
  agent_notes: z.string().trim().max(2000).optional().nullable(),
  intent: z.enum(["gather", "inform"]).optional(),
  roster_member_ids: z.array(z.string().uuid()).min(1).max(20),
  context_integrations: z
    .array(z.enum(["linear", "jira", "monday"]))
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
    revalidatePath("/settings/meetings");
    try {
      const user = await getCurrentUser();
      if (user) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: user.id,
          event: "agent_deployed",
          properties: {
            workspace_id: parsed.data.workspaceId,
            agent_destination: parsed.data.body.destination,
            agent_name: parsed.data.body.name,
          },
        });
        await posthog.shutdown();
      }
    } catch {
      // Analytics must never block deploy.
    }
    return { agent: result.data };
  });
}

const updateAgentArgsSchema = z.object({
  workspaceId: z.string().uuid(),
  agentId: z.string().uuid(),
  body: agentDeploySchema,
});

export async function updateAgentAction(
  input: z.infer<typeof updateAgentArgsSchema>,
): Promise<{ error?: string }> {
  const parsed = updateAgentArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const { workspaceId, agentId, body } = parsed.data;
  const result = await updateAgent(token, workspaceId, agentId, body as AgentDeployBody);
  if (!result.success) {
    return { error: result.error ?? "Failed to save the agent." };
  }

  revalidatePath("/agents");
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/activity");
  try {
    const user = await getCurrentUser();
    if (user) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: user.id,
        event: "agent_updated",
        properties: {
          workspace_id: workspaceId,
          agent_destination: body.destination,
          agent_name: body.name,
        },
      });
      await posthog.shutdown();
    }
  } catch {
    // Analytics must never block save.
  }
  return {};
}

const agentEnabledSchema = z.object({
  workspaceId: z.string().uuid(),
  agentId: z.string().uuid(),
  enabled: z.boolean(),
});

export async function setAgentEnabledAction(
  input: z.infer<typeof agentEnabledSchema>,
): Promise<{ error?: string }> {
  const parsed = agentEnabledSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }
  const result = await setAgentEnabled(
    token,
    parsed.data.workspaceId,
    parsed.data.agentId,
    parsed.data.enabled,
  );
  if (!result.success) {
    return { error: result.error ?? "Failed to update the agent." };
  }
  revalidatePath("/agents");
  revalidatePath(`/agents/${parsed.data.agentId}`);
  revalidatePath("/activity");
  return {};
}

const deleteAgentArgsSchema = z.object({
  workspaceId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export async function deleteAgentAction(
  input: z.infer<typeof deleteAgentArgsSchema>,
): Promise<{ error?: string }> {
  const parsed = deleteAgentArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }
  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }
  const result = await deleteAgent(
    token,
    parsed.data.workspaceId,
    parsed.data.agentId,
  );
  if (!result.success) {
    return { error: result.error ?? "Failed to delete the agent." };
  }
  revalidatePath("/agents");
  revalidatePath("/activity");
  return {};
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

export async function fetchAgentSessionDetail(input: {
  workspaceId: string;
  agentId: string;
  sessionId: string;
}): Promise<{ detail: AgentSessionDetail | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { detail: null, error: "Not signed in." };
  const result = await getAgentSessionDetail(
    token,
    input.workspaceId,
    input.agentId,
    input.sessionId,
  );
  if (!result.success) {
    return { detail: null, error: result.error ?? "Failed to load session." };
  }
  return { detail: result.data ?? null };
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
