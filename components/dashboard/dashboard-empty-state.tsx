import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardRangeDays } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  days: DashboardRangeDays;
}

export function DashboardEmptyState({ days }: DashboardEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-medium">No meeting data yet</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            No meetings completed in the last {days} days. Your dashboard fills
            in automatically once your agents start running — participation,
            blockers, and momentum, with zero meetings.
          </p>
        </div>
        <Link href="/agents" className={cn(buttonVariants())}>
          Set up a meeting
        </Link>
      </CardContent>
    </Card>
  );
}
