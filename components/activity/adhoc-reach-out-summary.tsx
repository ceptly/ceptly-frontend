"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
      <p className="ceptly-reachout-eyebrow">{intentLabel}</p>
      {topic ? (
        <p className={compact ? "text-sm font-medium" : "text-sm"}>{topic}</p>
      ) : null}
      {deliveryFacts && !agentPrompt && compact ? (
        <p className="ceptly-mono-block line-clamp-3">{deliveryFacts}</p>
      ) : null}
      {promptText ? (
        compact ? (
          agentPrompt ? (
            <p className="ceptly-mono-block line-clamp-3">{agentPrompt}</p>
          ) : (
            <p className="ceptly-mono-block line-clamp-3">{deliveryFacts}</p>
          )
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              className="ceptly-collapse"
              data-open={promptOpen}
              onClick={() => setPromptOpen((open) => !open)}
              aria-expanded={promptOpen}
            >
              <ChevronDown aria-hidden />
              view agent prompt
            </button>
            {promptOpen ? (
              <div className="ceptly-prompt-box">{promptText}</div>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
