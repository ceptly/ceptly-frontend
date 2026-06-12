import Link from "next/link";

import type { DashboardRangeDays } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: DashboardRangeDays[] = [7, 30, 90];

interface RangeSelectorProps {
  active: DashboardRangeDays;
}

export function RangeSelector({ active }: RangeSelectorProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border bg-card/50 p-1"
      role="group"
      aria-label="Date range"
    >
      {RANGE_OPTIONS.map((days) => (
        <Link
          key={days}
          href={days === 30 ? "/dashboard" : `/dashboard?days=${days}`}
          aria-current={days === active ? "true" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            days === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {days}d
        </Link>
      ))}
    </div>
  );
}
