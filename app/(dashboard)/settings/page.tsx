import { Suspense } from "react";

import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { SettingsPageContentSkeleton } from "@/components/page-skeletons";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function SettingsPage() {
  const user = await requireAuth();

  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

  return (
    <div className="ceptly-page flex flex-col gap-8">
      <div className="ceptly-page-head">
        <h1 className="ceptly-page-title">Workspace settings</h1>
        <p className="ceptly-page-sub">
          Manage your team and integrations.
        </p>
      </div>

      {workspace?.id ? (
        <Suspense fallback={<SettingsPageContentSkeleton />}>
          <SettingsPageContent
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            workspaceRole={workspace.role}
            canEdit={canEdit}
            currentUserId={user.id}
            userEmail={user.email}
          />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
