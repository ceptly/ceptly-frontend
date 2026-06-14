import { AlertTriangle, CalendarRange, Repeat, Users } from "lucide-react";

import { BlockerTrendChart } from "@/components/dashboard/blocker-trend-chart";
import { CarryOverHeatmap } from "@/components/dashboard/carry-over-heatmap";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MemberMomentumTable } from "@/components/dashboard/member-momentum-table";
import { ParticipationChart } from "@/components/dashboard/participation-chart";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { ParticipationList } from "@/components/dashboard/participation-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboard } from "@/lib/api/dashboard";
import type { DashboardRangeDays } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/server";

interface DashboardContentProps {
  workspaceId: string;
  days: DashboardRangeDays;
}

export async function DashboardContent({
  workspaceId,
  days,
}: DashboardContentProps) {
  const token = await getAccessToken();
  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load the dashboard.
      </p>
    );
  }

  const result = await getDashboard(token, workspaceId, days);
  const dashboard = result.data?.dashboard;

  if (!result.success || !dashboard) {
    return (
      <p className="text-sm text-muted-foreground">
        {result.error ?? "Could not load the dashboard."}
      </p>
    );
  }

  return (
    <>
      <div className="ceptly-page-head">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="ceptly-page-title">Dashboard</h1>
            <p className="ceptly-page-sub">
              How your team is moving — pulled from every meeting, no meetings
              required.
            </p>
          </div>
          <RangeSelector active={days} />
        </div>
      </div>

      {!dashboard.has_data ? (
        <DashboardEmptyState days={days} />
      ) : (
        <div className="flex flex-col gap-4">
          <KpiCards kpis={dashboard.kpis} days={days} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                Meeting participation
              </CardTitle>
              <CardDescription>
                Responses vs. expected conversations per day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ParticipationChart data={dashboard.participation.by_day} />
              <ParticipationList agents={dashboard.participation.by_agent} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                Blockers
              </CardTitle>
              <CardDescription>
                Reported, resolved, and how long they stay open.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlockerTrendChart blockers={dashboard.blockers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="size-4 text-muted-foreground" aria-hidden />
                Carry-over heatmap
              </CardTitle>
              <CardDescription>
                Work and blockers repeated across meetings — darker cells mean
                more carried-over items that day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarryOverHeatmap grid={dashboard.carry_over} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                Member momentum
              </CardTitle>
              <CardDescription>
                Per-member response rate, completed work, and blockers over the
                last {days} days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberMomentumTable
                members={dashboard.members}
                days={dashboard.carry_over.days}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
