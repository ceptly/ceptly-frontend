"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ActivityReachOutCard } from "@/components/activity/activity-reach-out-card";
import { REACH_OUTS_PER_PAGE } from "@/lib/activity/reach-out-card";
import type { ActivityAdhocSession } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ActivityAdhocListProps {
  sessions: ActivityAdhocSession[];
}

export function ActivityAdhocList({ sessions }: ActivityAdhocListProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(sessions.length / REACH_OUTS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const sliceStart = safePage * REACH_OUTS_PER_PAGE;
  const slice = sessions.slice(sliceStart, sliceStart + REACH_OUTS_PER_PAGE);
  const rangeStart = sessions.length === 0 ? 0 : sliceStart + 1;
  const rangeEnd = Math.min(sliceStart + REACH_OUTS_PER_PAGE, sessions.length);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent reach-outs. Use Chat → Reach out to message someone in Slack.
      </p>
    );
  }

  return (
    <div>
      <div className="ceptly-reachout-list">
        {slice.map((session) => (
          <ActivityReachOutCard key={session.session_id} session={session} />
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="ceptly-pager">
          <button
            type="button"
            className="ceptly-pager-btn"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "ceptly-pager-btn",
                index === safePage && "active",
              )}
              onClick={() => setPage(index)}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            className="ceptly-pager-btn"
            disabled={safePage >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <p className="ceptly-pager-info">
        Showing {rangeStart}–{rangeEnd} of {sessions.length} reach-outs
      </p>
    </div>
  );
}
