"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Check,
  CornerDownRight,
  Info,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContextFact } from "@/lib/api/context";
import { KN_GROUPS, chipDate, sourceVisual } from "./knowledge-config";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface FindingCardProps {
  finding: ContextFact;
  canEdit: boolean;
  onConfirm: (text?: string) => void;
  onDismiss: () => void;
}

function FindingCard({ finding, canEdit, onConfirm, onDismiss }: FindingCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(finding.text);
  const [leaving, setLeaving] = useState<"confirm" | "dismiss" | null>(null);
  const group = KN_GROUPS.find((g) => g.id === finding.group);
  const vis = sourceVisual(finding.source);
  const VisIcon = vis.icon;
  const ev = finding.evidence;

  function leave(kind: "confirm" | "dismiss", text?: string) {
    setLeaving(kind);
    setTimeout(() => {
      if (kind === "confirm") onConfirm(text);
      else onDismiss();
    }, 260);
  }

  return (
    <section className={"kn-finding" + (leaving ? " out" : "")}>
      <div className="kn-finding-top">
        <span className="kn-finding-eyebrow">
          {vis.img ? (
            <img src={vis.img} alt="" width={13} height={13} />
          ) : VisIcon ? (
            <VisIcon size={13} />
          ) : null}
          New finding · {finding.source.label} · {chipDate(finding.source.date)}
        </span>
        <span className="kn-finding-route">
          <CornerDownRight size={13} /> {group?.label ?? ""}
        </span>
      </div>

      {editing ? (
        <div className="kn-editrow">
          <Textarea
            rows={2}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      ) : (
        <div className="kn-finding-text">{finding.text}</div>
      )}

      {ev.type === "chat" && ev.quote ? (
        <div className="kn-finding-quote">
          <span className="ceptly-avatar ceptly-avatar-sm">
            {initialsOf(ev.speaker ?? "?")}
          </span>
          <div>
            <div className="kn-quote-bubble">{ev.quote}</div>
            <div className="kn-quote-by">
              {[ev.speaker, finding.source.label].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      ) : ev.snippet ? (
        <div className="kn-pop-snippet">{ev.snippet}</div>
      ) : null}

      {finding.uncertainty_note ? (
        <span className="kn-finding-why">
          <Info size={13} /> {finding.uncertainty_note}
        </span>
      ) : null}

      {canEdit ? (
        <div className="kn-finding-acts">
          {editing ? (
            <>
              <Button
                variant="default"
                size="sm"
                disabled={!draft.trim()}
                onClick={() => {
                  setEditing(false);
                  leave("confirm", draft.trim());
                }}
              >
                <Check size={13} /> Save & add to context
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(finding.text);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={() => leave("confirm")}>
                <Check size={13} /> Add to context
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil size={13} /> Edit
              </Button>
              <span className="spacer" />
              <Button variant="ghost" size="sm" onClick={() => leave("dismiss")}>
                <X size={13} /> Dismiss
              </Button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

interface ReviewQueueProps {
  findings: ContextFact[];
  canEdit: boolean;
  onConfirm: (factId: string, text?: string) => void;
  onDismiss: (factId: string) => void;
}

export function ReviewQueue({
  findings,
  canEdit,
  onConfirm,
  onDismiss,
}: ReviewQueueProps) {
  if (!findings.length) return null;
  return (
    <div className="kn-review">
      <div className="kn-review-head">
        <span className="kn-review-title">
          <Sparkles size={16} /> Needs your review
          <span className="kn-review-count">{findings.length}</span>
        </span>
        <span className="kn-review-sub">
          Ceptly holds anything it isn&apos;t sure about here. Nothing below is
          used by agents until you confirm it.
        </span>
      </div>
      {findings.map((finding) => (
        <FindingCard
          key={finding.id}
          finding={finding}
          canEdit={canEdit}
          onConfirm={(text) => onConfirm(finding.id, text)}
          onDismiss={() => onDismiss(finding.id)}
        />
      ))}
    </div>
  );
}
