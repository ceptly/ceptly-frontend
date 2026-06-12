"use client";

/* eslint-disable @next/next/no-img-element */

import { ExternalLink, Pencil, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { ContextFact } from "@/lib/api/context";
import { cn } from "@/lib/utils";
import { sourceVisual } from "./knowledge-config";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface EvidencePopoverProps {
  fact: ContextFact;
  onClose: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

/** The "receipt": where a fact came from, with the exact quote or snippet. */
export function EvidencePopover({
  fact,
  onClose,
  onEdit,
  onRemove,
}: EvidencePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const ev = fact.evidence;
  const vis = sourceVisual(fact.source);
  const Icon = vis.icon;

  return (
    <div className="kn-pop" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="kn-pop-eyebrow">
        {vis.img ? (
          <img src={vis.img} alt="" width={13} height={13} />
        ) : Icon ? (
          <Icon size={13} />
        ) : null}
        Where this came from
        <span className="kn-pop-where">{fact.source.label}</span>
      </div>
      {ev.type === "chat" && ev.quote ? (
        <div className="kn-pop-quote">
          <span className="ceptly-avatar ceptly-avatar-sm">
            {initialsOf(ev.speaker ?? "?")}
          </span>
          <div>
            <div className="kn-quote-bubble">{ev.quote}</div>
            {ev.speaker ? <div className="kn-quote-by">{ev.speaker}</div> : null}
          </div>
        </div>
      ) : ev.type === "doc" && ev.snippet ? (
        <div className="kn-pop-snippet">{ev.snippet}</div>
      ) : (
        <p className="kn-pop-note m-0">{ev.note ?? "No evidence recorded."}</p>
      )}
      <div className="kn-pop-foot">
        {ev.permalink ? (
          <a
            href={ev.permalink}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink size={13} /> Open in Slack
          </a>
        ) : null}
        <span className="spacer" />
        {onEdit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onEdit();
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onRemove();
            }}
          >
            <X size={13} /> Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
