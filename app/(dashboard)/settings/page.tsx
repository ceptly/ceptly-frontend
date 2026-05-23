import Link from "next/link";

import { SlackConnectionCard } from "@/components/settings/slack-connection-card";
import { TeamRosterCard } from "@/components/settings/team-roster-card";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { WorkspaceTimezoneForm } from "@/components/settings/workspace-timezone-form";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceTimezone } from "@/lib/api/conversations";
import { listRosterMembers } from "@/lib/api/roster";
import { getSlackConnectionStatus } from "@/lib/api/slack";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["founder", "admin"]);

interface SettingsPageProps {
  searchParams: Promise<{ slack?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? ADMIN_ROLES.has(workspace.role) : false;

  const token = await getAccessToken();
  const timezoneResult =
    workspace?.id && token
      ? await getWorkspaceTimezone(token, workspace.id)
      : null;

  const slackStatusResult =
    workspace?.id && token
      ? await getSlackConnectionStatus(token, workspace.id)
      : null;

  const rosterResult =
    workspace?.id && token
      ? await listRosterMembers(token, workspace.id)
      : null;

  const slackStatus = slackStatusResult?.data ?? { connected: false };
  const rosterMembers = rosterResult?.data?.members ?? [];

  const showConnectedAlert = params.slack === "connected";
  const showErrorAlert = params.slack === "error";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace and scheduled conversations.
        </p>
      </div>

      <ThemeSettings />

      {workspace?.id ? (
        <>
          <WorkspaceNameForm
            workspaceId={workspace.id}
            initialName={workspace.name}
            canEdit={canEdit}
          />

          {timezoneResult?.success && timezoneResult.data?.timezone ? (
            <WorkspaceTimezoneForm
              workspaceId={workspace.id}
              initialTimezone={timezoneResult.data.timezone}
              canEdit={canEdit}
            />
          ) : null}

          <SlackConnectionCard
            workspaceId={workspace.id}
            canEdit={canEdit}
            status={slackStatus}
            showConnectedAlert={showConnectedAlert}
            showErrorAlert={showErrorAlert}
          />

          <TeamRosterCard
            workspaceId={workspace.id}
            canEdit={canEdit}
            slackConnected={slackStatus.connected}
            members={rosterMembers}
          />

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold">Scheduled conversations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View your published check-in schedule. Edit it from the home page
              with AI.
            </p>
            <Link
              href="/settings/conversations"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Manage conversations
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No workspace found for your account.
        </p>
      )}
    </div>
  );
}
