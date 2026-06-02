import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ActivityPageContent } from "@/components/activity/activity-page-content";
import { ActivityPageShell } from "@/components/activity/activity-page-shell";
import { ActivityPageContentSkeleton } from "@/components/page-skeletons";
import { requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function ActivityPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];
  const role = workspace?.role;

  if (!canManageWorkspace(role)) {
    redirect("/chat");
  }

  if (!workspace?.id) {
    return (
      <ActivityPageShell>
        <p className="text-sm text-muted-foreground">
          Could not load activity.
        </p>
      </ActivityPageShell>
    );
  }

  return (
    <ActivityPageShell>
      <Suspense fallback={<ActivityPageContentSkeleton />}>
        <ActivityPageContent workspaceId={workspace.id} />
      </Suspense>
    </ActivityPageShell>
  );
}
