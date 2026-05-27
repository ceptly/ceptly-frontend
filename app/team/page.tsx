import Link from "next/link";

import { TeamRoster } from "@/components/team/team-roster";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceLanguage, getWorkspaceTimezone } from "@/lib/api/conversations";
import { getLinearConnectionStatus } from "@/lib/api/linear";
import { listRosterMembers } from "@/lib/api/roster";
import { getSlackConnectionStatus } from "@/lib/api/slack";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function TeamPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

  const token = await getAccessToken();

  const slackStatusResult =
    workspace?.id && token
      ? await getSlackConnectionStatus(token, workspace.id)
      : null;

  const linearStatusResult =
    workspace?.id && token
      ? await getLinearConnectionStatus(token, workspace.id)
      : null;

  const rosterResult =
    workspace?.id && token
      ? await listRosterMembers(token, workspace.id)
      : null;

  const timezoneResult =
    workspace?.id && token
      ? await getWorkspaceTimezone(token, workspace.id)
      : null;

  const languageResult =
    workspace?.id && token
      ? await getWorkspaceLanguage(token, workspace.id)
      : null;

  const slackStatus = slackStatusResult?.data ?? { connected: false };
  const linearStatus = linearStatusResult?.data ?? { connected: false };
  const rosterMembers = rosterResult?.data?.members ?? [];
  const workspaceTimezone =
    timezoneResult?.data?.timezone ?? "America/Chicago";
  const workspaceLanguage = languageResult?.data?.language ?? "en";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team roster</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People on this list receive scheduled check-in DMs in Slack.
          </p>
        </div>
      </div>

      {workspace?.id ? (
        <TeamRoster
          workspaceId={workspace.id}
          workspaceTimezone={workspaceTimezone}
          workspaceLanguage={workspaceLanguage}
          canEdit={canEdit}
          slackConnected={slackStatus.connected}
          linearConnected={linearStatus.connected}
          members={rosterMembers}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}

    </div>
  );
}
