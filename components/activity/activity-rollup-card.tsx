import Link from "next/link";
import { Check, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatActivityLatestLabel,
  pastSessionsLabel,
  type RollupCardStatus,
} from "@/lib/activity/rollup-card";
import { cn } from "@/lib/utils";

interface ActivityRollupCardProps {
  href: string;
  title: string;
  subtitle: string;
  status: RollupCardStatus;
  latestAt: string | null;
  responded: number;
  expected: number;
  progressPercent: number;
  summary: string | null;
  emptyMessage: string;
  pastSessionsCount: number;
}

export function ActivityRollupCard({
  href,
  title,
  subtitle,
  status,
  latestAt,
  responded,
  expected,
  progressPercent,
  summary,
  emptyMessage,
  pastSessionsCount,
}: ActivityRollupCardProps) {
  const hasSession = latestAt !== null && expected > 0;
  const isComplete = status === "complete";
  const pastLabel = pastSessionsLabel(pastSessionsCount);

  return (
    <Link href={href} className="ceptly-rollup-card-link">
      <article className="ceptly-rollup-card">
        <div className="ceptly-rollup-card-top">
          <div className="min-w-0">
            <h3 className="ceptly-rollup-card-title">{title}</h3>
            <p className="ceptly-rollup-card-desc">{subtitle}</p>
          </div>
          {status === "needs_attention" ? (
            <Badge variant="attention" className="shrink-0 border-0 font-bold">
              Needs attention
            </Badge>
          ) : null}
          {status === "complete" ? (
            <Badge variant="complete" className="shrink-0 gap-1">
              <Check className="size-3" aria-hidden />
              Complete
            </Badge>
          ) : null}
        </div>

        <div className="ceptly-rollup-card-body">
          {hasSession ? (
            <>
              <div className="ceptly-rollup-card-meta">
                <span className="ceptly-rollup-card-meta-muted">
                  Latest · {formatActivityLatestLabel(latestAt)}
                </span>
                <span className="ceptly-rollup-card-meta-strong">
                  {responded}/{expected} responded
                </span>
              </div>
              <div className="ceptly-rollup-card-track">
                <div
                  className={cn(
                    "ceptly-rollup-card-fill",
                    isComplete && "ceptly-rollup-card-fill-full",
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : null}

          <div className="ceptly-rollup-card-summary">
            {!hasSession ? (
              <p className="ceptly-rollup-card-summary-empty">{emptyMessage}</p>
            ) : summary ? (
              <p className="ceptly-rollup-card-sum">{summary}</p>
            ) : null}
          </div>

          <div className="ceptly-rollup-card-foot">
            {pastLabel ? (
              <>
                <History aria-hidden />
                {pastLabel}
              </>
            ) : (
              <span className="invisible" aria-hidden>
                0 past sessions
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
