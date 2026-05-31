import { CommunicationPlatformForm } from "@/components/settings/communication-platform-form";
import { WorkspaceInvites } from "@/components/settings/workspace-invites";
import { WorkspaceLanguageForm } from "@/components/settings/workspace-language-form";
import { WorkspaceMembersTable } from "@/components/settings/workspace-members";
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form";
import { WorkspaceTimezoneForm } from "@/components/settings/workspace-timezone-form";
import { fetchBillingStatus } from "@/lib/api/billing";
import { getCommunicationSettings } from "@/lib/api/communication";
import {
  getWorkspaceLanguage,
  getWorkspaceTimezone,
} from "@/lib/api/conversations";
import { listInvites } from "@/lib/api/invites";
import { listWorkspaceMembers } from "@/lib/api/members";
import type { WorkspaceMembership } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

interface SettingsPageContentProps {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceMembership["role"];
  canEdit: boolean;
  currentUserId: string;
  userEmail: string;
}

export async function SettingsPageContent({
  workspaceId,
  workspaceName,
  workspaceRole,
  canEdit,
  currentUserId,
  userEmail,
}: SettingsPageContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        No team found for your account.
      </p>
    );
  }

  const [
    timezoneResult,
    languageResult,
    invitesResult,
    membersResult,
    billingStatus,
    communicationResult,
  ] = await Promise.all([
    getWorkspaceTimezone(token, workspaceId),
    getWorkspaceLanguage(token, workspaceId),
    listInvites(token, workspaceId),
    listWorkspaceMembers(token, workspaceId),
    fetchBillingStatus(token, workspaceId),
    getCommunicationSettings(token, workspaceId),
  ]);

  const pendingInvites = invitesResult?.data?.invites ?? [];
  const members = membersResult?.data?.members ?? [];
  const communicationSettings = communicationResult?.data;

  return (
    <>
      <WorkspaceNameForm
        workspaceId={workspaceId}
        initialName={workspaceName}
        canEdit={canEdit}
      />

      {timezoneResult?.success && timezoneResult.data?.timezone ? (
        <WorkspaceTimezoneForm
          workspaceId={workspaceId}
          initialTimezone={timezoneResult.data.timezone}
          canEdit={canEdit}
        />
      ) : null}

      {languageResult?.success && languageResult.data?.language ? (
        <WorkspaceLanguageForm
          workspaceId={workspaceId}
          initialLanguage={languageResult.data.language}
          canEdit={canEdit}
        />
      ) : null}

      {communicationSettings ? (
        <CommunicationPlatformForm
          workspaceId={workspaceId}
          initialSettings={communicationSettings}
          canEdit={canEdit}
        />
      ) : null}

      <WorkspaceMembersTable
        workspaceId={workspaceId}
        canEdit={canEdit}
        currentUserId={currentUserId}
        currentUserRole={workspaceRole}
        members={members}
      />

      <WorkspaceInvites
        workspaceId={workspaceId}
        canEdit={canEdit}
        userEmail={userEmail}
        invites={pendingInvites}
        billing={billingStatus}
      />
    </>
  );
}
