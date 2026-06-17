import Link from "next/link";
import { CalendarClock, Send, Sparkles } from "lucide-react";

import { ActivityAdhocList } from "@/components/activity/activity-adhoc-list";
import { ActivityAttentionList } from "@/components/activity/activity-attention-list";
import { FollowUpsList } from "@/components/activity/follow-ups-list";
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
          <CalendarClock aria-hidden />
          Scheduled follow-ups
        </h2>
        {activity.follow_ups_enabled ? (
          <FollowUpsList
            workspaceId={workspaceId}
            items={activity.scheduled_follow_ups}
          />
        ) : (
          <div className="ceptly-list-card">
            <div className="ceptly-warn-row">
              <span className="mt-px shrink-0 text-muted-foreground">
                <Sparkles className="size-[18px]" aria-hidden />
              </span>
              <div className="ceptly-warn-main">
                <div className="ceptly-warn-title">
                  Autonomous follow-ups are a Pro feature
                </div>
                <div className="ceptly-warn-desc">
                  On Pro, agents detect commitments in conversations and
                  schedule themselves to check back automatically.{" "}
                  <Link
                    href="/settings/billing"
                    className="underline hover:text-foreground"
                  >
                    Upgrade your plan
                  </Link>
                  .
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

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
