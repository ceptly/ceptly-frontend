import { EmployeeChatPrompt } from "@/components/employee-chat-prompt";
import { listAppContextOptions } from "@/lib/api/conversations";
import { getLinearConnectionStatus } from "@/lib/api/linear";
import { listRosterMembers } from "@/lib/api/roster";
import { listSlackChannels } from "@/lib/api/slack-channels";
import { getAccessToken } from "@/lib/auth/server";

interface ChatPageContentProps {
  workspaceId?: string;
  canEdit: boolean;
}

export async function ChatPageContent({
  workspaceId,
  canEdit,
}: ChatPageContentProps) {
  const token = await getAccessToken();

  if (!workspaceId || !token) {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-4 py-7">
        <div className="mx-auto flex w-full max-w-[700px] min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="text-[34px] leading-tight font-normal tracking-tight">
              Welcome to Ceptly
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No team found for your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [
    linearStatusResult,
    appContextsResult,
    slackChannelsResult,
    rosterResult,
  ] = await Promise.all([
    getLinearConnectionStatus(token, workspaceId),
    listAppContextOptions(token, workspaceId),
    listSlackChannels(token, workspaceId),
    listRosterMembers(token, workspaceId),
  ]);

  const linearConnected = linearStatusResult?.data?.connected ?? false;
  const appContextOptions = appContextsResult?.data?.app_contexts ?? [];
  const slackChannels = slackChannelsResult?.data?.channels ?? [];
  const slackChannelsError = slackChannelsResult.success
    ? null
    : (slackChannelsResult.error ?? null);
  const rosterMembers = rosterResult?.data?.members ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-7">
      <div className="mx-auto flex w-full max-w-[700px] min-h-0 flex-1 flex-col">
        <EmployeeChatPrompt
          workspaceId={workspaceId}
          canEdit={canEdit}
          linearConnected={linearConnected}
          appContextOptions={appContextOptions}
          slackChannels={slackChannels}
          slackChannelsError={slackChannelsError}
          rosterMembers={rosterMembers}
        />
      </div>
    </div>
  );
}
