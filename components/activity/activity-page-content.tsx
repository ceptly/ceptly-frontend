import { Send } from "lucide-react";

import { ActivityAdhocList } from "@/components/activity/activity-adhoc-list";
import { ActivityAttentionList } from "@/components/activity/activity-attention-list";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceActivity } from "@/lib/api/activity";
import { getAccessToken } from "@/lib/auth/server";

interface ActivityPageContentProps {
  workspaceId: string;
}

export async function ActivityPageContent({
  workspaceId,
}: ActivityPageContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">Could not load activity.</p>
    );
  }

  const activityResult = await getWorkspaceActivity(token, workspaceId);
  const activity = activityResult.data?.activity;

  if (!activityResult.success || !activity) {
    return (
      <p className="text-sm text-muted-foreground">
        {activityResult.error ?? "Could not load activity."}
      </p>
    );
  }

  const attentionCount = activity.attention_count;

  return (
    <>
      <div className="ceptly-page-head">
        <h1 className="ceptly-page-title">Activity</h1>
        <p className="ceptly-page-sub">
          Rollups from your conversations, meetings, and one-off reach-outs.
          {attentionCount > 0 ? (
            <Badge variant="attention">{attentionCount} need attention</Badge>
          ) : null}
        </p>
      </div>

      <ActivityAttentionList
        workspaceId={workspaceId}
        items={activity.attention_items}
      />

      <section className="ceptly-section">
        <h2 className="ceptly-section-title">
          <Send aria-hidden />
          Recent reach-outs
        </h2>
        <ActivityAdhocList sessions={activity.adhoc_sessions} />
      </section>
    </>
  );
}
