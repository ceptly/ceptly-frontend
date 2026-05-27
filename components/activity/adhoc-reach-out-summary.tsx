"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdhocReachOutSummaryProps {
  intentLabel: string;
  topic?: string | null;
  deliveryFacts?: string | null;
  agentPrompt?: string | null;
  compact?: boolean;
}

export function AdhocReachOutSummary({
  intentLabel,
  topic,
  deliveryFacts,
  agentPrompt,
  compact = false,
}: AdhocReachOutSummaryProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const promptText = agentPrompt ?? deliveryFacts;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {intentLabel}
      </p>
      {topic ? (
        <p className={compact ? "text-sm font-medium" : "text-sm"}>{topic}</p>
      ) : null}
      {deliveryFacts && !agentPrompt ? (
        compact ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {deliveryFacts}
          </p>
        ) : null
      ) : null}
      {promptText ? (
        compact ? (
          agentPrompt ? (
            <p className="line-clamp-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {agentPrompt}
            </p>
          ) : (
            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {deliveryFacts}
            </p>
          )
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setPromptOpen((open) => !open)}
              aria-expanded={promptOpen}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  promptOpen && "rotate-180",
                )}
              />
              view agent prompt
            </button>
            {promptOpen ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-muted-foreground dark:border-white/10">
                {promptText}
              </pre>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
