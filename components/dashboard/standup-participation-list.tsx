import { Progress } from "@/components/ui/progress";
import type { DashboardStandupParticipation } from "@/lib/api/types";

interface StandupParticipationListProps {
  standups: DashboardStandupParticipation[];
}

export function StandupParticipationList({
  standups,
}: StandupParticipationListProps) {
  if (standups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {standups.map((standup) => (
        <div key={standup.standup_id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{standup.standup_name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {standup.responded}/{standup.expected} responses ·{" "}
              {standup.sessions} session{standup.sessions === 1 ? "" : "s"}
              {standup.response_rate_pct !== null
                ? ` · ${Math.round(standup.response_rate_pct)}%`
                : ""}
            </span>
          </div>
          <Progress value={standup.response_rate_pct ?? 0} />
        </div>
      ))}
    </div>
  );
}
