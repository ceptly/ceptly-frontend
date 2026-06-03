"use client";

import { Fragment } from "react";
import { MessageSquare } from "lucide-react";

interface SlackPreviewProps {
  opener: string | null;
  loading: boolean;
  /** Display time in the message header, e.g. "9:00 AM". */
  time: string;
  /** Shown when the form isn't complete enough to generate yet. */
  incompleteHint?: string;
}

// Light Slack-style token highlighting: *bold*, <@mentions>, #channels.
function renderOpener(text: string) {
  const parts = text.split(/(\*[^*]+\*|<@[^>]+>|#[a-z0-9_-]+)/gi);
  return parts.map((part, i) => {
    if (/^\*[^*]+\*$/.test(part)) {
      return <b key={i}>{part.slice(1, -1)}</b>;
    }
    if (/^<@[^>]+>$/.test(part)) {
      return (
        <span key={i} className="ag-tok">
          @{part.slice(2, -1)}
        </span>
      );
    }
    if (/^#[a-z0-9_-]+$/i.test(part)) {
      return (
        <span key={i} className="ag-tok">
          {part}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function SlackPreview({
  opener,
  loading,
  time,
  incompleteHint = "Fill in the agent's type, persona, audience, and name to generate a live preview of its first message.",
}: SlackPreviewProps) {
  return (
    <div className="ag-preview">
      <div className="ag-preview-head">
        <MessageSquare className="size-[13px]" /> Live preview
      </div>
      <div className="ag-slack">
        <span className="ag-slack-avatar" aria-hidden="true">
          C
        </span>
        <div className="ag-slack-body flex-1">
          <div className="ag-slack-name">
            <b>Ceptly</b>
            <span className="ag-slack-tag">APP</span>
            <span className="ag-slack-time">{time}</span>
          </div>
          {loading ? (
            <div className="mt-2 flex flex-col gap-2">
              <span className="ag-slack-skeleton" style={{ width: "92%" }} />
              <span className="ag-slack-skeleton" style={{ width: "80%" }} />
              <span className="ag-slack-skeleton" style={{ width: "60%" }} />
            </div>
          ) : opener ? (
            <div className="ag-slack-msg">{renderOpener(opener)}</div>
          ) : (
            <div className="ag-slack-empty mt-1.5">{incompleteHint}</div>
          )}
        </div>
      </div>
    </div>
  );
}
