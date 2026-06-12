"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContextFact } from "@/lib/api/context";
import { EvidencePopover } from "./evidence-popover";
import { SourceChip } from "./source-chip";

interface FactRowProps {
  fact: ContextFact;
  canEdit: boolean;
  flash?: boolean;
  onEdit: (text: string) => void;
  onRemove: () => void;
}

export function FactRow({ fact, canEdit, flash, onEdit, onRemove }: FactRowProps) {
  const [pop, setPop] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fact.text);

  if (editing) {
    return (
      <div className="kn-fact">
        <div className="kn-editrow">
          <Textarea
            rows={2}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="kn-editrow-acts">
            <Button
              variant="default"
              size="sm"
              disabled={!draft.trim()}
              onClick={() => {
                onEdit(draft.trim());
                setEditing(false);
              }}
            >
              <Check size={13} /> Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(fact.text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={"kn-fact" + (flash ? " flash" : "")}>
      <div className="kn-fact-text">
        {fact.text}
        {fact.edited ? <span className="kn-edited">edited by you</span> : null}
      </div>
      <div className="kn-fact-side">
        {canEdit ? (
          <span className="kn-fact-acts">
            <button
              type="button"
              className="kn-act"
              aria-label="Edit fact"
              onClick={() => {
                setDraft(fact.text);
                setEditing(true);
              }}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="kn-act"
              aria-label="Remove fact"
              onClick={onRemove}
            >
              <X size={14} />
            </button>
          </span>
        ) : null}
        <span className="kn-povwrap">
          <SourceChip src={fact.source} open={pop} onClick={() => setPop(!pop)} />
          {pop ? (
            <EvidencePopover
              fact={fact}
              onClose={() => setPop(false)}
              onEdit={
                canEdit
                  ? () => {
                      setDraft(fact.text);
                      setEditing(true);
                    }
                  : undefined
              }
              onRemove={canEdit ? onRemove : undefined}
            />
          ) : null}
        </span>
      </div>
    </div>
  );
}
