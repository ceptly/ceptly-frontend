import Link from "next/link";
import { CalendarCheck, CalendarClock, Send } from "lucide-react";

import { ActivityAdhocList } from "@/components/activity/activity-adhoc-list";
import { ActivityAttentionList } from "@/components/activity/activity-attention-list";
import { ActivityConversationCard } from "@/components/activity/activity-conversation-card";
import { ActivityStandupCard } from "@/components/activity/activity-standup-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getWorkspaceActivity } from "@/lib/api/activity";
import { getAccessToken } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

interface ActivityPageContentProps {
  workspaceId: string;
  canManageConversations: boolean;
}

export async function ActivityPageContent({
  workspaceId,
  canManageConversations,
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
          Rollups from your check-ins, standups, and one-off reach-outs.
          {attentionCount > 0 ? (
            <Badge variant="attention">
              {attentionCount} need attention
            </Badge>
          ) : null}
        </p>
      </div>

      <ActivityAttentionList
        workspaceId={workspaceId}
        items={activity.attention_items}
      />

      <section className="ceptly-section">
        <div className="ceptly-section-head">
          <h2 className="ceptly-section-title">
            <CalendarCheck aria-hidden />
            Standups
          </h2>
          {canManageConversations ? (
            <Link
              href="/settings/standups"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage standups
            </Link>
          ) : null}
        </div>
        {(activity.channel_standups ?? []).length === 0 ? (
          <p className="ceptly-card-empty not-italic">
            No channel standups yet.
            {canManageConversations ? (
              <>
                {" "}
                <Link
                  href="/settings/standups"
                  className="font-medium text-foreground not-italic underline-offset-4 hover:underline"
                >
                  Add a standup
                </Link>{" "}
                or{" "}
                <Link
                  href="/chat"
                  className="font-medium text-foreground not-italic underline-offset-4 hover:underline"
                >
                  set one up in Chat
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : (
          <div className="ceptly-rollup-card-grid">
            {activity.channel_standups.map((standup) => (
              <ActivityStandupCard key={standup.standup_id} standup={standup} />
            ))}
          </div>
        )}
      </section>

      <section className="ceptly-section">
        <div className="ceptly-section-head">
          <h2 className="ceptly-section-title">
            <CalendarClock aria-hidden />
            Scheduled check-ins
          </h2>
          {canManageConversations ? (
            <Link
              href="/activity/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Add conversation
            </Link>
          ) : null}
        </div>
        {activity.scheduled_conversations.length === 0 ? (
          <p className="ceptly-card-empty not-italic">
            No scheduled conversations yet.
            {canManageConversations ? (
              <>
                {" "}
                <Link
                  href="/activity/new"
                  className="font-medium text-foreground not-italic underline-offset-4 hover:underline"
                >
                  Add a conversation
                </Link>{" "}
                or{" "}
                <Link
                  href="/chat"
                  className="font-medium text-foreground not-italic underline-offset-4 hover:underline"
                >
                  set one up in Chat
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : (
          <div className="ceptly-rollup-card-grid">
            {activity.scheduled_conversations.map((conversation) => (
              <ActivityConversationCard
                key={conversation.id}
                conversation={conversation}
              />
            ))}
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
