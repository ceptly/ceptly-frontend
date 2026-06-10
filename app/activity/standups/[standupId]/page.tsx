import Link from "next/link";
import { redirect } from "next/navigation";

import { AgentEditFields } from "@/components/agents/agent-edit-fields";
import { StandupDetailActions } from "@/components/activity/standup-detail-actions";
import { StandupSessionDetailView } from "@/components/activity/standup-session-detail";
import { buttonVariants } from "@/components/ui/button";
import { standupToInitialValues } from "@/lib/agents";
import { listChatChannels } from "@/lib/api/communication";
import {
  getWorkspaceTimezone,
  listAppContextOptions,
  listConversationTemplates,
} from "@/lib/api/conversations";
import { FALLBACK_PERSONAS, listPersonas } from "@/lib/api/personas";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import {
  getStandupSessionDetail,
  listStandupSessions,
  listStandups,
} from "@/lib/api/standups";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import { cn } from "@/lib/utils";

interface StandupActivityPageProps {
  params: Promise<{ standupId: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function StandupActivityPage({
  params,
  searchParams,
}: StandupActivityPageProps) {
  const { standupId } = await params;
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
        Could not load standup.
      </p>
    );
  }

  const standupsResult = await listStandups(token, workspace.id);
  const standup = standupsResult.data?.standups.find(
    (item) => item.id === standupId,
  );

  if (!standupsResult.success || !standup) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {standupsResult.error ?? "Standup not found."}
      </p>
    );
  }

  const canEdit = canManageWorkspace(workspace.role);
  const isEditing = edit === "1" && canEdit;

  const channelLabel = standup.slack_channel_name
    ? `#${standup.slack_channel_name}`
    : standup.slack_channel_id;

  if (isEditing) {
    const [
      rosterResult,
      appContextsResult,
      slackChannelsResult,
      templatesResult,
      timezoneResult,
      chatChannelsResult,
      personasResult,
    ] = await Promise.all([
      listRosterMembers(token, workspace.id),
      listAppContextOptions(token, workspace.id),
      listSlackChannels(token, workspace.id),
      listConversationTemplates(token, workspace.id),
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
    const apiTemplates = templatesResult.data?.templates ?? [];
    const templates =
      apiTemplates.length > 0 ? apiTemplates : DEFAULT_CONVERSATION_TEMPLATES;
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
          href={`/activity/standups/${standupId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 mb-4 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; {standup.name}
        </Link>
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-[26px] font-normal tracking-tight">
            Edit {standup.name}
          </h1>
        </div>

        <AgentEditFields
          workspaceId={workspace.id}
          workspaceTimezone={workspaceTimezone}
          personas={personas}
          templates={templates}
          rosterMembers={rosterMembers}
          appContextOptions={appContextOptions}
          slackChannels={slackChannels}
          slackChannelsError={slackChannelsError}
          chatChannels={chatChannels}
          communicationPlatform={communicationPlatform}
          chatChannelsError={chatChannelsError}
          editTarget={{ id: standupId, kind: "standup" }}
          initialValues={standupToInitialValues(standup)}
          closeHref={`/activity/standups/${standupId}`}
        />
      </div>
    );
  }

  const sessionsResult = await listStandupSessions(
    token,
    workspace.id,
    standupId,
  );
  const sessions = sessionsResult.data?.sessions ?? [];
  const firstSessionId = sessions[0]?.session_id;

  const initialDetailResult = firstSessionId
    ? await getStandupSessionDetail(
        token,
        workspace.id,
        standupId,
        firstSessionId,
      )
    : null;
  const initialSession = initialDetailResult?.data?.session ?? null;

  return (
    <div className="ceptly-page ceptly-page-narrow">
      <Link href="/agents" className="ceptly-back">
        ← Agents
      </Link>
      <div className="ceptly-page-head">
        <h1 className="ceptly-page-title">{standup.name}</h1>
        <p className="ceptly-page-sub">
          {channelLabel} · {standup.members.length} participants
        </p>
      </div>

      {canEdit ? (
        <div className="mb-6">
          <StandupDetailActions
            workspaceId={workspace.id}
            standupId={standupId}
            standupName={standup.name}
            enabled={standup.enabled}
            schedule={{
              timezone: standup.timezone,
              frequency: standup.frequency,
              days_of_week: standup.days_of_week,
              time_local: standup.time_local,
              enabled: standup.enabled,
            }}
          />
        </div>
      ) : null}

      {!sessionsResult.success ? (
        <p className="text-sm text-muted-foreground">
          {sessionsResult.error ?? "Could not load sessions."}
        </p>
      ) : (
        <StandupSessionDetailView
          workspaceId={workspace.id}
          standupId={standupId}
          sessions={sessions}
          initialSession={initialSession}
        />
      )}
    </div>
  );
}
