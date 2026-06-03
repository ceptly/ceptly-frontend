import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AgentsOverview } from "@/components/agents/agents-overview";
import { getWorkspaceActivity } from "@/lib/api/activity";
import { getAccessToken, requireAuth } from "@/lib/auth/server";
import { canManageWorkspace } from "@/lib/roles";

export default async function AgentsPage() {
  const user = await requireAuth();
  const workspace = user.workspaces?.[0];

  if (!workspace?.id) {
    redirect("/chat");
  }
  if (!canManageWorkspace(workspace.role)) {
    redirect("/chat");
  }

  const token = await getAccessToken();
  if (!token) {
    redirect("/auth");
  }

  const activityResult = await getWorkspaceActivity(token, workspace.id);
  const activity = activityResult.data?.activity;
  const loadError =
    !activityResult.success || !activity
      ? (activityResult.error ?? "Could not load agents.")
      : null;

  return (
    <Suspense>
      {loadError || !activity ? (
        <div className="ceptly-page">
          <div className="ag-head">
            <div>
              <h1>Agents</h1>
              <p>{loadError}</p>
            </div>
          </div>
        </div>
      ) : (
        <AgentsOverview
          channelStandups={activity.channel_standups ?? []}
          scheduledConversations={activity.scheduled_conversations ?? []}
        />
      )}
    </Suspense>
  );
}
