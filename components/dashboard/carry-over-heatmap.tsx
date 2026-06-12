import { CheckCircle2 } from "lucide-react";

import type { DashboardCarryOverGrid } from "@/lib/api/types";

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function cellTitle(
  name: string,
  date: string,
  carried: number,
  reReported: number,
): string {
  const parts: string[] = [];
  if (carried > 0) {
    parts.push(`${carried} carried task${carried === 1 ? "" : "s"}`);
  }
  if (reReported > 0) {
    parts.push(
      `${reReported} re-reported blocker${reReported === 1 ? "" : "s"}`,
    );
  }
  return `${name} · ${formatDay(date)}: ${parts.join(", ") || "no carry-over"}`;
}

interface CarryOverHeatmapProps {
  grid: DashboardCarryOverGrid;
}

export function CarryOverHeatmap({ grid }: CarryOverHeatmapProps) {
  if (grid.cells.length === 0 || grid.members.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
        No repeated work detected — updates are moving forward.
      </p>
    );
  }

  const cellByKey = new Map(
    grid.cells.map((cell) => [`${cell.roster_member_id}|${cell.date}`, cell]),
  );
  // Label roughly 8 columns regardless of range length.
  const labelStep = Math.max(1, Math.ceil(grid.days.length / 8));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {grid.members.map((member) => (
          <div
            key={member.roster_member_id}
            className="flex items-center gap-2 py-0.5"
          >
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
              {member.display_name}
            </span>
            <div className="flex flex-1 gap-px">
              {grid.days.map((date) => {
                const cell = cellByKey.get(
                  `${member.roster_member_id}|${date}`,
                );
                const count =
                  (cell?.carried_tasks ?? 0) +
                  (cell?.re_reported_blockers ?? 0);
                const intensity = Math.min(20 + count * 22, 92);
                return (
                  <div
                    key={date}
                    title={cellTitle(
                      member.display_name,
                      date,
                      cell?.carried_tasks ?? 0,
                      cell?.re_reported_blockers ?? 0,
                    )}
                    className="h-5 min-w-1.5 flex-1 rounded-[2px] bg-muted/50"
                    style={
                      count > 0
                        ? {
                            backgroundColor: `color-mix(in oklab, var(--destructive) ${intensity}%, transparent)`,
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <span className="w-28 shrink-0" />
          <div className="flex flex-1 gap-px">
            {grid.days.map((date, index) => (
              <span
                key={date}
                className="min-w-1.5 flex-1 text-[10px] text-muted-foreground"
              >
                {index % labelStep === 0 ? formatDay(date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
