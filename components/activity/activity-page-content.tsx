import Link from "next/link";

import { ActivityAdhocList } from "@/components/activity/activity-adhoc-list";
import { ActivityAttentionList } from "@/components/activity/activity-attention-list";
import { ActivityConversationCard } from "@/components/activity/activity-conversation-card";
import { ActivityStandupCard } from "@/components/activity/activity-standup-card";
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

  return (
    <>
      <ActivityAttentionList
        workspaceId={workspaceId}
        items={activity.attention_items}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Scheduled check-ins</h2>
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
          <p className="text-sm text-muted-foreground">
            No scheduled conversations yet.
            {canManageConversations ? (
              <>
                {" "}
                <Link
                  href="/activity/new"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Add a conversation
                </Link>{" "}
                or{" "}
                <Link
                  href="/chat"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  set one up in Chat
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : (
          <div className="space-y-3">
            {activity.scheduled_conversations.map((conversation) => (
              <ActivityConversationCard
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Channel standups</h2>
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
          <p className="text-sm text-muted-foreground">
            No channel standups yet.
            {canManageConversations ? (
              <>
                {" "}
                <Link
                  href="/settings/standups"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Add a standup
                </Link>{" "}
                or{" "}
                <Link
                  href="/chat"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  set one up in Chat
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : (
          <div className="space-y-3">
            {activity.channel_standups.map((standup) => (
              <ActivityStandupCard key={standup.standup_id} standup={standup} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Recent reach-outs</h2>
        <ActivityAdhocList sessions={activity.adhoc_sessions} />
      </section>
    </>
  );
}
