import { ActivityRollupCard } from "@/components/activity/activity-rollup-card";
import type { ActivityScheduledConversation } from "@/lib/api/types";
import { formatSchedulePreview } from "@/lib/schedule/preview";
import { rollupStatusFromCounts } from "@/lib/activity/rollup-card";

interface ActivityConversationCardProps {
  conversation: ActivityScheduledConversation;
}

export function ActivityConversationCard({
  conversation,
}: ActivityConversationCardProps) {
  const schedulePreview = formatSchedulePreview(
    conversation.time_local,
    conversation.timezone,
    conversation.frequency,
    conversation.days_of_week,
    conversation.enabled,
  );
  const run = conversation.latest_run;
  const responded = run?.responded_count ?? 0;
  const expected = run?.expected_count ?? 0;
  const progress =
    expected > 0 ? Math.round((responded / expected) * 100) : 0;
  const status = rollupStatusFromCounts(
    responded,
    expected,
    run !== null,
    conversation.missing_members.length,
  );

  const summaryText =
    conversation.summary?.trim() ||
    (conversation.missing_members.length > 0
      ? `Waiting on ${conversation.missing_members.map((m) => m.display_name).join(", ")}${
          run && run.not_responded_count > conversation.missing_members.length
            ? ` +${run.not_responded_count - conversation.missing_members.length} more`
            : ""
        }.`
      : null);

  return (
    <ActivityRollupCard
      href={`/activity/${conversation.id}`}
      title={conversation.name}
      subtitle={schedulePreview}
      status={status}
      latestAt={run?.fired_at ?? null}
      responded={responded}
      expected={expected}
      progressPercent={progress}
      summary={summaryText}
      emptyMessage="No check-in runs yet. Results appear after the schedule fires."
      pastSessionsCount={conversation.run_count ?? 0}
    />
  );
}
