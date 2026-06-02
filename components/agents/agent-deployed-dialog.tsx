"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const CONFETTI_COLORS = [
  "#56FF3C",
  "#B1FFA5",
  "#ffffff",
  "#3DBE26",
  "#e9ffe4",
  "#7CFF63",
];

interface AgentDeployedDialogProps {
  name?: string;
  detail?: string;
  title?: string;
  buttonLabel?: string;
  onClose: () => void;
}

// Celebratory dialog: confetti burst + drawing checkmark. Auto-dismiss is
// handled by the parent; the CSS plays the full in/out animation.
export function AgentDeployedDialog({
  name = "Your agent",
  detail,
  title = "Agent deployed",
  buttonLabel = "View my agents",
  onClose,
}: AgentDeployedDialogProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => {
        const tx = (Math.random() * 2 - 1) * 320;
        const ty = (Math.random() * 2 - 1) * 110 + 200;
        const rot = Math.random() * 760 - 200;
        const w = 6 + Math.random() * 7;
        return {
          "--tx": tx + "px",
          "--ty": ty + "px",
          "--rot": rot + "deg",
          "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          width: w + "px",
          height: w * 1.7 + "px",
          borderRadius: Math.random() < 0.4 ? "50%" : "1px",
          animationDelay: Math.random() * 0.18 + "s",
          animationDuration: 1.15 + Math.random() * 0.8 + "s",
        } as CSSProperties;
      }),
    [],
  );

  return (
    <div
      className="ag-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="ag-modal-backdrop" onClick={onClose} />
      <div className="ag-confetti" aria-hidden="true">
        {pieces.map((st, i) => (
          <i key={i} style={st} />
        ))}
      </div>
      <div className="ag-modal-card">
        <div className="ag-check">
          <span className="ag-check-ring" />
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle className="ag-check-circle" cx="26" cy="26" r="24" />
            <path className="ag-check-tick" d="M15 27 l7 7 l15 -16" />
          </svg>
        </div>
        <h2 className="ag-modal-title">{title}</h2>
        <p className="ag-modal-sub">
          <b>{name}</b> is live
          {detail ? (
            <>
              <br />
              {detail}
            </>
          ) : null}
        </p>
        <Button className="w-full" onClick={onClose}>
          {buttonLabel} <ArrowRight className="size-[15px]" />
        </Button>
      </div>
    </div>
  );
}
