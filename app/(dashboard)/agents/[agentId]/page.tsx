import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";

import { AgentEditFields } from "@/components/agents/agent-edit-fields";
import { AgentDetailActions } from "@/components/agents/agent-detail-actions";
import { AgentSessionDetailView } from "@/components/agents/agent-session-detail";
import { FollowUpsList } from "@/components/activity/follow-ups-list";
import { getWorkspaceActivity } from "@/lib/api/activity";
import { buttonVariants } from "@/components/ui/button";
import { agentToInitialValues, agentHref } from "@/lib/agents";
import { listChatChannels } from "@/lib/api/communication";
import {
  getWorkspaceTimezone,
  listAppContextOptions,
} from "@/lib/api/workspace-settings";
import { FALLBACK_PERSONAS, listPersonas } from "@/lib/api/personas";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import {
  getAgent,
  getAgentSessions,
  getAgentSessionDetail,
} from "@/lib/api/agents";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface AgentPageProps {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function AgentPage({
  params,
  searchParams,
}: AgentPageProps) {
  const { agentId } = await params;
  const { edit } = await searchParams;
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!canManageWorkspace(workspace?.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!workspace?.id || !token) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Could not load agent.
      </p>
    );
  }

  const agentResult = await getAgent(token, workspace.id, agentId);
  const agent = agentResult.data?.agent;

  if (!agentResult.success || !agent) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {agentResult.error ?? "Agent not found."}
      </p>
    );
  }

  const canEdit = canManageWorkspace(workspace.role);
  const isEditing = edit === "1" && canEdit;
  const detailHref = agentHref(agentId);

  if (isEditing) {
    const [
      rosterResult,
      appContextsResult,
      slackChannelsResult,
      timezoneResult,
      chatChannelsResult,
      personasResult,
    ] = await Promise.all([
      listRosterMembers(token, workspace.id),
      listAppContextOptions(token, workspace.id),
      listSlackChannels(token, workspace.id),
      getWorkspaceTimezone(token, workspace.id),
      listChatChannels(token, workspace.id),
      listPersonas(token),
    ]);

    const rosterMembers = rosterResult.data?.members ?? [];
    const appContextOptions = appContextsResult.data?.app_contexts ?? [];
    const slackChannels = slackChannelsResult.data?.channels ?? [];
    const slackChannelsError = slackChannelsResult.success
      ? null
      : (slackChannelsResult.error ?? "Could not load Slack channels.");
    const workspaceTimezone =
      timezoneResult.data?.timezone ?? "America/Chicago";
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
        <Link
          href={detailHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 mb-4 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; {agent.name}
        </Link>
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-[26px] font-normal tracking-tight">
            Edit {agent.name}
          </h1>
        </div>

        <AgentEditFields
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
          editTarget={{ id: agentId }}
          initialValues={agentToInitialValues(agent)}
          closeHref={detailHref}
        />
      </div>
    );
  }

  const [sessionsResult, rosterResult, activityResult] = await Promise.all([
    getAgentSessions(token, workspace.id, agentId),
    listRosterMembers(token, workspace.id),
    getWorkspaceActivity(token, workspace.id),
  ]);
  const sessions = sessionsResult.data?.sessions ?? [];
  const firstSessionId = sessions[0]?.session_id;

  const activity = activityResult.data?.activity;
  const agentFollowUps =
    activity?.follow_ups_enabled && canEdit
      ? (activity.scheduled_follow_ups ?? []).filter(
          (followUp) => followUp.agent_id === agentId,
        )
      : [];

  const memberNames: Record<string, string> = {};
  for (const member of rosterResult.data?.members ?? []) {
    memberNames[member.id] = member.display_name;
  }

  const initialDetailResult = firstSessionId
    ? await getAgentSessionDetail(token, workspace.id, agentId, firstSessionId)
    : null;
  const initialSession = initialDetailResult?.data ?? null;

  const subtitle =
    agent.destination === "channel" && agent.channel_id
      ? `#${agent.channel_id}`
      : `${agent.roster_member_ids.length} participant${agent.roster_member_ids.length !== 1 ? "s" : ""}`;

  return (
    <div className="ceptly-page ceptly-page-narrow">
      <Link href="/agents" className="ceptly-back">
        <ArrowLeft className="size-[15px]" aria-hidden />
        Agents
      </Link>
      {!sessionsResult.success ? (
        <>
          <div className="ceptly-page-head">
            <h1 className="ceptly-page-title">{agent.name}</h1>
            <p className="ceptly-page-sub">{subtitle}</p>
          </div>
          {canEdit ? (
            <div className="mb-6">
              <AgentDetailActions
                workspaceId={workspace.id}
                agentId={agentId}
                agentName={agent.name}
                enabled={agent.enabled}
              />
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {sessionsResult.error ?? "Could not load sessions."}
          </p>
        </>
      ) : (
        <AgentSessionDetailView
          workspaceId={workspace.id}
          agentId={agentId}
          sessions={sessions}
          initialSession={initialSession}
          agentName={agent.name}
          subtitle={subtitle}
          memberNames={memberNames}
          actions={
            canEdit ? (
              <AgentDetailActions
                workspaceId={workspace.id}
                agentId={agentId}
                agentName={agent.name}
                enabled={agent.enabled}
              />
            ) : null
          }
        />
      )}

      {agentFollowUps.length > 0 ? (
        <section className="ceptly-section mt-8">
          <h2 className="ceptly-section-title">
            <CalendarClock aria-hidden />
            Follow-ups from this agent
          </h2>
          <FollowUpsList workspaceId={workspace.id} items={agentFollowUps} />
        </section>
      ) : null}
    </div>
  );
}
