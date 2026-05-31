import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatReachOutDate,
  reachOutPromptPreview,
  reachOutStatusLabel,
  reachOutStatusVariant,
  reachOutTitle,
} from "@/lib/activity/reach-out-card";
import type { ActivityAdhocSession } from "@/lib/api/types";

interface ActivityReachOutCardProps {
  session: ActivityAdhocSession;
}

export function ActivityReachOutCard({ session }: ActivityReachOutCardProps) {
  const title = reachOutTitle(session);
  const promptPreview = reachOutPromptPreview(session);
  const statusVariant = reachOutStatusVariant(session.status);
  const statusLabel = reachOutStatusLabel(session.status);

  return (
    <Link
      href={`/activity/${session.conversation_id}`}
      className="ceptly-reachout block"
    >
      <div className="ceptly-reachout-top">
        <div className="ceptly-reachout-eyebrow">{session.intent_label}</div>
        <Badge variant={statusVariant} className="shrink-0">
          {statusVariant === "complete" ? (
            <Check className="size-3" aria-hidden />
          ) : null}
          {statusLabel}
        </Badge>
      </div>
      <div className="ceptly-reachout-title">{title}</div>
      {promptPreview ? (
        <div className="ceptly-mono-block">{promptPreview}</div>
      ) : null}
      <div className="ceptly-reachout-foot">
        {session.member_name} · {formatReachOutDate(session.started_at)}
      </div>
    </Link>
  );
}
