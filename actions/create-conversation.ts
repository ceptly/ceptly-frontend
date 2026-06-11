"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPostHogClient } from "@/lib/posthog-server";
import { getCurrentUser } from "@/lib/auth/server";

import { createConversationFromTemplate } from "@/lib/api/conversations";
import type {
  ConversationResultDestination,
  WorkspaceSchedule,
} from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

const scheduleSchema = z.object({
  timezone: z.string().trim().min(1),
  frequency: z.enum(["daily", "specific_days"]),
  days_of_week: z.array(z.number().int().min(0).max(6)),
  time_local: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  enabled: z.boolean(),
});

const schema = z.object({
  workspaceId: z.string().uuid(),
  templateId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  agentPersona: z.string().trim().max(4000).optional().nullable(),
  conversationGoal: z.string().trim().max(500).optional(),
  personaPreset: z.string().trim().min(1).max(50).optional(),
  agentNotes: z.string().trim().max(2000).optional().nullable(),
  rosterMemberIds: z.array(z.string().uuid()).min(1),
  contextIntegrations: z
    .array(z.enum(["linear", "jira", "monday"]))
    .optional(),
  resultDestinations: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("slack_channel"),
          channel_id: z.string().trim().min(1).max(64),
          name: z.string().trim().max(200).optional(),
        }),
        z.object({
          type: z.literal("roster_dm"),
          roster_member_id: z.string().uuid(),
        }),
        z.object({
          type: z.literal("workspace_digest"),
        }),
      ]),
    )
    .max(20)
    .optional(),
  schedule: scheduleSchema,
});

export async function publishConversationFromTemplate(input: {
  workspaceId: string;
  templateId: string;
  name?: string;
  agentPersona?: string | null;
  conversationGoal?: string;
  personaPreset?: string;
  agentNotes?: string | null;
  rosterMemberIds: string[];
  contextIntegrations?: string[];
  resultDestinations?: ConversationResultDestination[];
  schedule: WorkspaceSchedule;
}): Promise<{ error?: string; conversationId?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = await getAccessToken();
  if (!token) {
    return { error: "You must be signed in." };
  }

  const result = await createConversationFromTemplate(
    token,
    parsed.data.workspaceId,
    {
      template_id: parsed.data.templateId,
      name: parsed.data.name,
      agent_persona: parsed.data.personaPreset
        ? undefined
        : parsed.data.agentPersona,
      conversation_goal: parsed.data.personaPreset
        ? undefined
        : parsed.data.conversationGoal,
      persona_preset: parsed.data.personaPreset,
      agent_notes: parsed.data.agentNotes,
      roster_member_ids: parsed.data.rosterMemberIds,
      context_integrations: parsed.data.contextIntegrations,
      result_destinations: parsed.data.resultDestinations,
      schedule: parsed.data.schedule,
    },
  );

  if (!result.success || !result.data?.conversation) {
    return { error: result.error ?? "Failed to create conversation." };
  }

  revalidatePath("/activity");
  revalidatePath("/agents");
  const user = await getCurrentUser();
  if (user) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.id,
      event: "conversation_published",
      properties: {
        workspace_id: parsed.data.workspaceId,
        template_id: parsed.data.templateId,
        conversation_id: result.data.conversation.id,
        roster_size: parsed.data.rosterMemberIds.length,
      },
    });
    await posthog.shutdown();
  }
  return { conversationId: result.data.conversation.id };
}
