import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardKpis, DashboardRangeDays } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  kpis: DashboardKpis;
  days: DashboardRangeDays;
  followUpsEnabled: boolean;
}

function formatHours(hours: number): string {
  if (hours >= 48) {
    return `${Math.round(hours / 24)}d`;
  }
  return `${Math.round(hours)}h`;
}

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <Card className="gap-2 py-5">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {detail ? (
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis, days, followUpsEnabled }: KpiCardsProps) {
  const delta = kpis.response_rate_delta_pct;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Response rate"
        value={
          kpis.response_rate_pct !== null
            ? `${Math.round(kpis.response_rate_pct)}%`
            : "—"
        }
        detail={
          delta !== null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                delta >= 0 ? "text-emerald-600" : "text-destructive",
              )}
            >
              {delta >= 0 ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {delta >= 0 ? "+" : ""}
              {delta} pts vs. prior {days}d
            </span>
          ) : (
            `Across ${kpis.sessions_completed} sessions`
          )
        }
      />
      <KpiCard
        label="Meetings completed"
        value={kpis.sessions_completed}
        detail={`Last ${days} days`}
      />
      <KpiCard
        label="Open blockers"
        value={kpis.open_blockers}
        detail={
          kpis.oldest_open_blocker_days !== null
            ? `Oldest open ${kpis.oldest_open_blocker_days}d`
            : kpis.avg_resolution_hours !== null
              ? `Avg. resolution ${formatHours(kpis.avg_resolution_hours)}`
              : "Nothing blocking the team"
        }
      />
      <KpiCard
        label="Tasks completed"
        value={kpis.tasks_done}
        detail={
          kpis.carry_over_count > 0
            ? `${kpis.carry_over_count} carry-overs detected`
            : "No repeated work detected"
        }
      />
      {followUpsEnabled ? (
        <KpiCard
          label="Pending follow-ups"
          value={kpis.pending_follow_ups}
          detail={
            kpis.pending_follow_ups > 0
              ? "Scheduled check-ins ahead"
              : "Nothing scheduled"
          }
        />
      ) : null}
    </div>
  );
}
