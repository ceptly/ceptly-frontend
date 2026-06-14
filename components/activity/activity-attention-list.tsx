"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  AlertTriangle,
  Clock,
  MailWarning,
  MessageSquareWarning,
  TriangleAlert,
  X,
} from "lucide-react";

import { dismissActivityAttentionAction } from "@/actions/activity";
import type { ActivityAttentionItem } from "@/lib/api/types";

interface ActivityAttentionListProps {
  workspaceId: string;
  items: ActivityAttentionItem[];
}

function attentionHref(item: ActivityAttentionItem): string {
  if (item.type === "roster_tracker_mismatch") {
    return "/team";
  }
  return `/agents/${item.agent_id}`;
}

function formatMissingTrackers(
  trackers: ("linear" | "jira" | "monday")[],
): string {
  const labels = trackers.map((tracker) =>
    tracker === "linear"
      ? "Linear"
      : tracker === "jira"
        ? "Jira"
        : "Monday.com",
  );
  if (labels.length > 1) {
    return labels.slice(0, -1).join(", ") + " or " + labels[labels.length - 1];
  }
  return labels[0] ?? "issue tracker";
}

function AttentionIcon({ type }: { type: ActivityAttentionItem["type"] }) {
  if (type === "roster_tracker_mismatch") {
    return <MailWarning className="size-[18px]" aria-hidden />;
  }
  if (type === "blocker") {
    return <AlertTriangle className="size-[18px]" aria-hidden />;
  }
  if (type === "missing_responses") {
    return <MessageSquareWarning className="size-[18px]" aria-hidden />;
  }
  return <Clock className="size-[18px]" aria-hidden />;
}

function attentionTitle(item: ActivityAttentionItem): string {
  if (item.type === "missing_responses") {
    const names =
      item.missing_names.length > 0
        ? item.missing_names.join(", ")
        : `${item.missing_count} people`;
    return `${item.agent_name} · ${item.missing_count} haven't responded (${names})`;
  }
  if (item.type === "blocker") {
    return `${item.member_name} reported a blocker in ${item.agent_name}`;
  }
  if (item.type === "roster_tracker_mismatch") {
    return `${item.member_name} · no ${formatMissingTrackers(item.missing_trackers)} account matches ${item.member_email}`;
  }
  return `Reach out to ${item.member_name} · waiting for reply`;
}

function attentionDetail(item: ActivityAttentionItem): string | null {
  if (item.type === "blocker") {
    return item.excerpt;
  }
  if (item.type === "awaiting_reply") {
    return item.topic;
  }
  if (item.type === "roster_tracker_mismatch") {
    return `Use the same email in Slack and ${formatMissingTrackers(item.missing_trackers)}. Update the roster email on Team or fix the email in your issue tracker.`;
  }
  return null;
}

function isDismissible(
  item: ActivityAttentionItem,
): item is Extract<ActivityAttentionItem, { type: "roster_tracker_mismatch" }> {
  return item.type === "roster_tracker_mismatch";
}

export function ActivityAttentionList({
  workspaceId,
  items,
}: ActivityAttentionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return null;
  }

  const handleDismiss = (
    item: Extract<ActivityAttentionItem, { type: "roster_tracker_mismatch" }>,
  ) => {
    startTransition(async () => {
      const result = await dismissActivityAttentionAction({
        workspaceId,
        itemType: "roster_tracker_mismatch",
        itemKey: item.roster_member_id,
      });

      if (result.error) {
        console.error(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <section className="ceptly-section">
      <h2 className="ceptly-section-title">
        <TriangleAlert aria-hidden />
        Needs your attention
      </h2>
      <div className="ceptly-list-card">
        {items.map((item, index) => {
          const detail = attentionDetail(item);
          const key =
            item.type === "blocker"
              ? `blocker-${item.session_id}`
              : item.type === "awaiting_reply"
                ? `awaiting-${item.session_id}`
                : item.type === "roster_tracker_mismatch"
                  ? `tracker-mismatch-${item.roster_member_id}`
                  : `missing-${item.agent_id}-${item.session_id}`;

          return (
            <div className="ceptly-warn-row" key={`${key}-${index}`}>
              <span
                className={
                  item.type === "roster_tracker_mismatch"
                    ? "ceptly-warn-ico"
                    : "mt-px shrink-0 text-muted-foreground"
                }
              >
                <AttentionIcon type={item.type} />
              </span>
              <Link href={attentionHref(item)} className="ceptly-warn-main">
                <div className="ceptly-warn-title">{attentionTitle(item)}</div>
                {detail ? (
                  <div className="ceptly-warn-desc">{detail}</div>
                ) : null}
              </Link>
              {isDismissible(item) ? (
                <button
                  type="button"
                  className="ceptly-warn-x"
                  disabled={isPending}
                  aria-label={`Dismiss alert for ${item.member_name}`}
                  onClick={() => handleDismiss(item)}
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
