import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityChannelStandup } from "@/lib/api/types";

interface ActivityStandupCardProps {
  standup: ActivityChannelStandup;
}

function formatSessionDate(firedAt: string): string {
  return new Date(firedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function styleLabel(style: ActivityChannelStandup["style"]): string {
  return style === "broadcast" ? "Broadcast" : "Sequential";
}

export function ActivityStandupCard({ standup }: ActivityStandupCardProps) {
  const channelLabel = standup.slack_channel_name
    ? `#${standup.slack_channel_name}`
    : standup.slack_channel_id;
  const session = standup.latest_session;
  const responded = session?.responded_count ?? 0;
  const expected = session?.participant_count ?? 0;
  const progress = expected > 0 ? Math.round((responded / expected) * 100) : 0;

  return (
    <Link href={`/activity/standups/${standup.standup_id}`} className="block">
      <Card className="transition-colors hover:bg-muted/30 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{standup.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {channelLabel} · {styleLabel(standup.style)}
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 px-6 pb-4">
          {session ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Latest · {formatSessionDate(session.scheduled_fire_at)}
                </span>
                <span className="font-medium">
                  {responded}/{expected} responded
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {session.summary_preview ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {session.summary_preview}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No standup sessions yet. Results will appear after the schedule
              fires.
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
