"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock, Check, X } from "lucide-react";

import {
  cancelFollowUpAction,
  rescheduleFollowUpAction,
} from "@/actions/follow-ups";
import { Button } from "@/components/ui/button";
import type { ScheduledFollowUp } from "@/lib/api/types";

interface FollowUpsListProps {
  workspaceId: string;
  items: ScheduledFollowUp[];
}

function formatScheduledFor(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** ISO string -> value for <input type="datetime-local"> (local time, no tz). */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function FollowUpsList({ workspaceId, items }: FollowUpsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");

  if (items.length === 0) {
    return (
      <div className="ceptly-list-card">
        <div className="ceptly-warn-row">
          <div className="ceptly-warn-main">
            <div className="ceptly-warn-desc">
              No follow-ups scheduled. Agents will schedule these automatically
              when a conversation surfaces a commitment to check back on.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCancel = (followUpId: string) => {
    startTransition(async () => {
      const result = await cancelFollowUpAction({ workspaceId, followUpId });
      if (result.error) {
        console.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleReschedule = (followUpId: string) => {
    if (!draftValue) {
      return;
    }
    const scheduledFor = new Date(draftValue).toISOString();
    startTransition(async () => {
      const result = await rescheduleFollowUpAction({
        workspaceId,
        followUpId,
        scheduledFor,
      });
      if (result.error) {
        console.error(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="ceptly-list-card">
      {items.map((item) => (
        <div className="ceptly-warn-row" key={item.id}>
          <span className="mt-px shrink-0 text-muted-foreground">
            <CalendarClock className="size-[18px]" aria-hidden />
          </span>
          <div className="ceptly-warn-main">
            <div className="ceptly-warn-title">
              {item.member_name} · {formatScheduledFor(item.scheduled_for)}
            </div>
            <div className="ceptly-warn-desc">
              {item.item_text}
              {item.agent_id && item.agent_name ? (
                <>
                  {" · "}
                  <Link
                    href={`/agents/${item.agent_id}`}
                    className="underline hover:text-foreground"
                  >
                    {item.agent_name}
                  </Link>
                </>
              ) : null}
            </div>
            {editingId === item.id ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="border border-border bg-background px-2 py-1 text-xs"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending || !draftValue}
                  onClick={() => handleReschedule(item.id)}
                >
                  <Check className="size-3.5" aria-hidden />
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </div>
          {editingId === item.id ? null : (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setEditingId(item.id);
                  setDraftValue(toLocalInputValue(item.scheduled_for));
                }}
              >
                Reschedule
              </Button>
              <button
                type="button"
                className="ceptly-warn-x"
                disabled={isPending}
                aria-label={`Cancel follow-up with ${item.member_name}`}
                onClick={() => handleCancel(item.id)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
