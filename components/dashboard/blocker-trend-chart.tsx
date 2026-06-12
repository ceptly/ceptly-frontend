"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardBlockerStats } from "@/lib/api/types";

const chartConfig = {
  reported: {
    label: "Reported",
    color: "var(--chart-1)",
  },
  resolved: {
    label: "Resolved",
    color: "var(--chart-2)",
  },
  open_at_end: {
    label: "Open",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatHours(hours: number): string {
  if (hours >= 48) {
    return `${Math.round(hours / 24)} days`;
  }
  return `${Math.round(hours)} hours`;
}

interface BlockerTrendChartProps {
  blockers: DashboardBlockerStats;
}

export function BlockerTrendChart({ blockers }: BlockerTrendChartProps) {
  const hasActivity =
    blockers.reported_in_window > 0 ||
    blockers.resolved_in_window > 0 ||
    blockers.open_count > 0;

  if (!hasActivity) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No blockers reported in this window — the team is unblocked.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <ComposedChart data={blockers.trend} margin={{ left: -20, right: 8 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={formatDay}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => formatDay(String(label))}
              />
            }
          />
          <Bar
            dataKey="reported"
            fill="var(--color-reported)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="resolved"
            fill="var(--color-resolved)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
          <Line
            dataKey="open_at_end"
            type="monotone"
            stroke="var(--color-open_at_end)"
            strokeWidth={2}
            dot={false}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </ComposedChart>
      </ChartContainer>

      <div className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-2xl font-semibold">
              {blockers.reported_in_window}
            </div>
            <div className="text-xs text-muted-foreground">Reported</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">
              {blockers.resolved_in_window}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {blockers.median_resolution_hours !== null ? (
          <p className="text-xs text-muted-foreground">
            Median time to resolve:{" "}
            <span className="font-medium text-foreground">
              {formatHours(blockers.median_resolution_hours)}
            </span>
          </p>
        ) : null}

        {blockers.open_count > 0 ? (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">
              Open blockers by age
            </div>
            {blockers.age_buckets
              .filter((bucket) => bucket.count > 0)
              .map((bucket) => (
                <div
                  key={bucket.bucket}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {bucket.bucket}
                  </span>
                  <span className="font-medium">{bucket.count}</span>
                </div>
              ))}
          </div>
        ) : null}

        {blockers.oldest_open ? (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="attention" className="border-0">
                Oldest open · {blockers.oldest_open.age_days}d
              </Badge>
            </div>
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {blockers.oldest_open.member_name}:{" "}
              {blockers.oldest_open.description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
