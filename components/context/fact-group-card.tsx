"use client";

import { Check, CircleDashed, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ContextFact } from "@/lib/api/context";
import { FactRow } from "./fact-row";
import type { KnowledgeGroupMeta } from "./knowledge-config";

interface FactGroupCardProps {
  group: KnowledgeGroupMeta;
  facts: ContextFact[];
  canEdit: boolean;
  /** Ids of facts that just landed (confirmed/added) — flash once. */
  flashIds: Set<string>;
  onEditFact: (factId: string, text: string) => void;
  onRemoveFact: (factId: string) => void;
  onAddFact: (text: string) => void;
  /** Extra block rendered after the facts (synced projects in Priorities). */
  extra?: ReactNode;
}

export function FactGroupCard({
  group,
  facts,
  canEdit,
  flashIds,
  onEditFact,
  onRemoveFact,
  onAddFact,
  extra,
}: FactGroupCardProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const GroupIcon = group.icon;
  const hasContent = facts.length > 0 || Boolean(extra);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onAddFact(text);
    setDraft("");
    setAdding(false);
  }

  return (
    <section className="kn-group">
      <div className="kn-group-head">
        <span className="kn-group-mark">
          <GroupIcon size={17} />
        </span>
        <div className="kn-group-titles">
          <div className="kn-group-title">
            {group.label}
            {facts.length ? (
              <span className="kn-group-count">
                {facts.length} {facts.length === 1 ? "fact" : "facts"}
              </span>
            ) : null}
          </div>
          <div className="kn-group-desc">{group.desc}</div>
        </div>
        {canEdit ? (
          <span className="kn-group-add">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={"Add a fact to " + group.label}
              onClick={() => setAdding(true)}
            >
              <Plus size={15} />
            </Button>
          </span>
        ) : null}
      </div>

      {hasContent ? (
        <div className="kn-facts">
          {facts.map((fact) => (
            <FactRow
              key={fact.id}
              fact={fact}
              canEdit={canEdit}
              flash={flashIds.has(fact.id)}
              onEdit={(text) => onEditFact(fact.id, text)}
              onRemove={() => onRemoveFact(fact.id)}
            />
          ))}
          {extra}
        </div>
      ) : !adding ? (
        <div className="kn-ghost">
          <CircleDashed size={15} />
          <span className="kn-ghost-txt">{group.ghost}</span>
        </div>
      ) : null}

      {adding ? (
        <div className="kn-addrow">
          <div className="kn-editrow">
            <Textarea
              rows={2}
              value={draft}
              autoFocus
              placeholder={"Something Ceptly should know — e.g. " + group.example}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <div className="kn-editrow-acts">
              <Button
                variant="default"
                size="sm"
                disabled={!draft.trim()}
                onClick={submit}
              >
                <Check size={13} /> Add fact
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : hasContent && canEdit ? (
        <div className="kn-addrow">
          <button
            type="button"
            className="kn-addrow-open"
            onClick={() => setAdding(true)}
          >
            <Plus size={13} /> Add a fact
          </button>
        </div>
      ) : null}
    </section>
  );
}
