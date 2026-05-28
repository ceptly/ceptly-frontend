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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team and integrations.
          </p>
        </div>
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
