import { TeamRoster } from "@/components/team/team-roster";
import { getWorkspaceBootstrap } from "@/lib/api/workspace-bootstrap";
import { getAccessToken } from "@/lib/auth/server";

interface TeamPageContentProps {
  workspaceId: string;
  canEdit: boolean;
}

export async function TeamPageContent({
  workspaceId,
  canEdit,
}: TeamPageContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        No team found for your account.
      </p>
    );
  }

  const bootstrapResult = await getWorkspaceBootstrap(token, workspaceId);
  const bootstrap = bootstrapResult.data?.bootstrap;

  return (
    <TeamRoster
      workspaceId={workspaceId}
      workspaceTimezone={bootstrap?.timezone ?? "America/Chicago"}
      workspaceLanguage={bootstrap?.language ?? "en"}
      canEdit={canEdit}
      slackConnected={bootstrap?.integrations.slack ?? false}
      linearConnected={bootstrap?.integrations.linear ?? false}
      jiraConnected={bootstrap?.integrations.jira ?? false}
      mondayConnected={bootstrap?.integrations.monday ?? false}
      clickupConnected={bootstrap?.integrations.clickup ?? false}
      teamsConnected={bootstrap?.integrations.teams ?? false}
      communicationPlatform={bootstrap?.communication_platform ?? "slack"}
      members={bootstrap?.roster ?? []}
    />
  );
}
