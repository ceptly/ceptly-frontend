import { Suspense } from "react";

import { TeamPageContent } from "@/components/team/team-page-content";
import { TeamPageContentSkeleton } from "@/components/page-skeletons";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function TeamPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const canEdit = workspace ? canManageWorkspace(workspace.role) : false;

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
        <Suspense fallback={<TeamPageContentSkeleton />}>
          <TeamPageContent workspaceId={workspace.id} canEdit={canEdit} />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">
          No team found for your account.
        </p>
      )}
    </div>
  );
}
