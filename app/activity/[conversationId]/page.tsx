import Link from "next/link";
import { redirect } from "next/navigation";

import { ConversationDetailActions } from "@/components/activity/conversation-detail-actions";
import { AgentEditFields } from "@/components/agents/agent-edit-fields";
import { ConversationResultsClient } from "@/components/activity/conversation-results-client";
import { ConversationSessionsClient } from "@/components/activity/conversation-sessions-client";
import { buttonVariants } from "@/components/ui/button";
import { buildConversationActivitySubtitle } from "@/lib/activity/conversation-detail";
import { conversationToInitialValues } from "@/lib/agents";
import { listConversationSessions } from "@/lib/api/conversation-sessions";
import {
  getConversation,
  getWorkspaceTimezone,
  listAppContextOptions,
  listConversations,
  listConversationTemplates,
} from "@/lib/api/conversations";
import { listChatChannels } from "@/lib/api/communication";
import {
  getLatestConversationRun,
  listConversationRuns,
} from "@/lib/api/conversation-results";
import { FALLBACK_PERSONAS, listPersonas } from "@/lib/api/personas";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import { cn } from "@/lib/utils";

interface ActivityConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ActivityConversationPage({
  params,
  searchParams,
}: ActivityConversationPageProps) {
  const { conversationId } = await params;
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
        Could not load conversation.
      </p>
    );
  }

  const conversationResult = await getConversation(
    token,
    workspace.id,
    conversationId,
  );
  if (!conversationResult.success || !conversationResult.data?.conversation) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        {conversationResult.error ?? "Conversation not found."}
      </p>
    );
  }

  const conversation = conversationResult.data.conversation;
  const isAdhoc = conversation.kind === "adhoc";
  const canEdit = canManageWorkspace(workspace.role);
  const isEditing = edit === "1" && canEdit && !isAdhoc;

  if (isAdhoc) {
    const sessionsResult = await listConversationSessions(
      token,
      workspace.id,
      conversationId,
    );
    const sessions = sessionsResult.data?.sessions ?? [];

    return (
      <div className="ceptly-page ceptly-page-narrow">
        <Link href="/activity" className="ceptly-back">
          ← Activity
        </Link>
        <div className="ceptly-page-head">
          <h1 className="ceptly-page-title">{conversation.name}</h1>
          <p className="ceptly-page-sub">Reach out</p>
        </div>

        <ConversationSessionsClient
          workspaceId={workspace.id}
          conversationId={conversationId}
          sessions={sessions}
        />
      </div>
    );
  }

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
          href={`/activity/${conversationId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 mb-4 w-fit px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          &lt; {conversation.name}
        </Link>
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-heading)] text-[26px] font-normal tracking-tight">
            Edit {conversation.name}
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
          editTarget={{ id: conversationId, kind: "conversation" }}
          initialValues={conversationToInitialValues(conversation)}
          closeHref={`/activity/${conversationId}`}
        />
      </div>
    );
  }

  const [runsResult, latestResult, allConversationsResult] = await Promise.all([
    listConversationRuns(token, workspace.id, conversationId),
    getLatestConversationRun(token, workspace.id, conversationId),
    canEdit ? listConversations(token, workspace.id) : Promise.resolve(null),
  ]);

  const runs = runsResult.data?.runs ?? [];
  const latestRun = latestResult.data?.run ?? null;
  const conversationSubtitle = buildConversationActivitySubtitle(conversation);
  const conversationCount =
    allConversationsResult?.data?.conversations?.length ?? 1;
  const canDelete = canEdit && conversationCount > 1;

  return (
    <div className="ceptly-page ceptly-page-narrow">
      <Link href="/agents" className="ceptly-back">
        ← Agents
      </Link>

      {canEdit ? (
        <div className="mb-6">
          <ConversationDetailActions
            workspaceId={workspace.id}
            conversationId={conversationId}
            conversationName={conversation.name}
            canDelete={canDelete}
            enabled={conversation.enabled}
            schedule={{
              timezone: conversation.timezone,
              frequency: conversation.frequency,
              days_of_week: conversation.days_of_week,
              time_local: conversation.time_local,
              enabled: conversation.enabled,
            }}
          />
        </div>
      ) : null}

      <ConversationResultsClient
        workspaceId={workspace.id}
        conversationId={conversationId}
        conversationName={conversation.name}
        conversationSubtitle={conversationSubtitle}
        runs={runs}
        initialRun={latestRun}
      />
    </div>
  );
}
