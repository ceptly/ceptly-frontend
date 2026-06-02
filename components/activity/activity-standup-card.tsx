import { ActivityRollupCard } from "@/components/activity/activity-rollup-card";
import type { ActivityChannelStandup } from "@/lib/api/types";
import { rollupStatusFromCounts } from "@/lib/activity/rollup-card";

interface ActivityStandupCardProps {
  standup: ActivityChannelStandup;
}

function styleLabel(style: ActivityChannelStandup["style"]): string {
  return style === "broadcast" ? "Broadcast" : "Sequential";
}

export function ActivityStandupCard({ standup }: ActivityStandupCardProps) {
  const channelLabel = standup.slack_channel_name
    ? `#${standup.slack_channel_name}`
    : standup.slack_channel_id;
  const scheduleLabel = standup.enabled
    ? `${channelLabel} · ${styleLabel(standup.style)}`
    : "Standup is paused";
  const session = standup.latest_session;
  const responded = session?.responded_count ?? 0;
  const expected = session?.participant_count ?? 0;
  const progress =
    expected > 0 ? Math.round((responded / expected) * 100) : 0;
  const status = rollupStatusFromCounts(
    responded,
    expected,
    session !== null,
  );

  return (
    <ActivityRollupCard
      href={`/activity/standups/${standup.standup_id}`}
      title={standup.name}
      subtitle={scheduleLabel}
      status={status}
      latestAt={session?.scheduled_fire_at ?? null}
      responded={responded}
      expected={expected}
      progressPercent={progress}
      summary={session?.summary_preview?.trim() || null}
      emptyMessage="No standup sessions yet. Results appear after the schedule fires."
      pastSessionsCount={standup.session_count ?? 0}
    />
  );
}
