import { ConversationCreateForm } from "@/components/settings/conversation-create-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_CONVERSATION_TEMPLATES } from "@/lib/conversation-templates";
import {
  listAppContextOptions,
  listConversationTemplates,
  getWorkspaceTimezone,
} from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken } from "@/lib/auth/server";

interface NewConversationContentProps {
  workspaceId: string;
}

export async function NewConversationContent({
  workspaceId,
}: NewConversationContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Could not load the conversation form. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const [
    templatesResult,
    rosterResult,
    timezoneResult,
    appContextsResult,
    slackChannelsResult,
  ] = await Promise.all([
    listConversationTemplates(token, workspaceId),
    listRosterMembers(token, workspaceId),
    getWorkspaceTimezone(token, workspaceId),
    listAppContextOptions(token, workspaceId),
    listSlackChannels(token, workspaceId),
  ]);

  const apiTemplates = templatesResult.data?.templates ?? [];
  const templates =
    apiTemplates.length > 0 ? apiTemplates : DEFAULT_CONVERSATION_TEMPLATES;
  const templatesLoadFailed = !templatesResult.success;
  const usedTemplateFallback =
    templatesResult.success && apiTemplates.length === 0;
  const rosterMembers = rosterResult.data?.members ?? [];
  const timezone = timezoneResult.data?.timezone ?? "America/Chicago";
  const appContextOptions = appContextsResult.data?.app_contexts ?? [];
  const slackChannels = slackChannelsResult.data?.channels ?? [];
  const slackChannelsError = slackChannelsResult.success
    ? null
    : (slackChannelsResult.error ??
      "Could not load Slack channels. You can still publish and add destinations when editing.");

  return (
    <>
      {templatesLoadFailed ? (
        <Alert variant="destructive">
          <AlertDescription>
            {templatesResult.error ?? "Could not load templates from the API."}{" "}
            Showing the default Daily standup template offline — publish may fail
            until the backend is reachable.
          </AlertDescription>
        </Alert>
      ) : usedTemplateFallback ? (
        <Alert>
          <AlertDescription>
            The API returned no templates. Using the built-in Daily standup
            template.
          </AlertDescription>
        </Alert>
      ) : null}

      <ConversationCreateForm
        workspaceId={workspaceId}
        workspaceTimezone={timezone}
        templates={templates}
        rosterMembers={rosterMembers}
        appContextOptions={appContextOptions}
        slackChannels={slackChannels}
        slackChannelsError={slackChannelsError}
      />
    </>
  );
}
