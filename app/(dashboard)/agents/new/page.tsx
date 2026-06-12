import { redirect } from "next/navigation";

import { AgentDeployForm } from "@/components/agents/agent-deploy-form";
import {
  getWorkspaceTimezone,
  listAppContextOptions,
} from "@/lib/api/conversations";
import { listChatChannels } from "@/lib/api/communication";
import { FALLBACK_PERSONAS, listPersonas } from "@/lib/api/personas";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import type { DeployAgentType } from "@/lib/agents";

const VALID_TYPES: DeployAgentType[] = ["checkin", "reachout", "standup"];

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType = VALID_TYPES.includes(type as DeployAgentType)
    ? (type as DeployAgentType)
    : "checkin";

  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!workspace?.id) {
    redirect("/chat");
  }
  if (!canManageWorkspace(workspace.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!token) {
    redirect("/auth");
  }

  const [
    rosterResult,
    timezoneResult,
    appContextsResult,
    slackChannelsResult,
    chatChannelsResult,
    personasResult,
  ] = await Promise.all([
    listRosterMembers(token, workspace.id),
    getWorkspaceTimezone(token, workspace.id),
    listAppContextOptions(token, workspace.id),
    listSlackChannels(token, workspace.id),
    listChatChannels(token, workspace.id),
    listPersonas(token),
  ]);

  const rosterMembers = rosterResult.data?.members ?? [];
  const workspaceTimezone = timezoneResult.data?.timezone ?? "America/Chicago";
  const appContextOptions = appContextsResult.data?.app_contexts ?? [];
  const slackChannels = slackChannelsResult.data?.channels ?? [];
  const slackChannelsError = slackChannelsResult.success
    ? null
    : (slackChannelsResult.error ?? "Could not load Slack channels.");
  const chatChannels = chatChannelsResult.data?.channels ?? [];
  const communicationPlatform = chatChannelsResult.data?.platform ?? "slack";
  const chatChannelsError = chatChannelsResult.success
    ? null
    : (chatChannelsResult.error ?? "Could not load channels.");
  const personas = personasResult.data?.personas?.length
    ? personasResult.data.personas
    : FALLBACK_PERSONAS;

  return (
    <div className="ceptly-page ceptly-page-wide">
      <AgentDeployForm
        workspaceId={workspace.id}
        workspaceTimezone={workspaceTimezone}
        personas={personas}
        rosterMembers={rosterMembers}
        appContextOptions={appContextOptions}
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
        chatChannels={chatChannels}
        communicationPlatform={communicationPlatform}
        chatChannelsError={chatChannelsError}
        initialType={initialType}
      />
    </div>
  );
}
