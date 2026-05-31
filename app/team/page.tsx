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
    <div className="ceptly-page flex flex-col gap-8">
      <div className="ceptly-page-head">
        <h1 className="ceptly-page-title">Team roster</h1>
        <p className="ceptly-page-sub">
          People on this list receive scheduled check-in DMs in Slack.
        </p>
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
