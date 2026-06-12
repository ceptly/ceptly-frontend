"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardParticipationPoint } from "@/lib/api/types";

const chartConfig = {
  expected: {
    label: "Expected",
    color: "var(--chart-3)",
  },
  responded: {
    label: "Responded",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface ParticipationChartProps {
  data: DashboardParticipationPoint[];
}

export function ParticipationChart({ data }: ParticipationChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: -20, right: 8 }}>
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
        <Area
          dataKey="expected"
          type="monotone"
          fill="var(--color-expected)"
          fillOpacity={0.12}
          stroke="var(--color-expected)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
        <Area
          dataKey="responded"
          type="monotone"
          fill="var(--color-responded)"
          fillOpacity={0.3}
          stroke="var(--color-responded)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
