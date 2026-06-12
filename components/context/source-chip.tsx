"use client";

/* eslint-disable @next/next/no-img-element */

import type { ContextFactSource } from "@/lib/api/context";
import { chipDate, sourceVisual } from "./knowledge-config";

interface SourceChipProps {
  src: ContextFactSource;
  open?: boolean;
  onClick?: () => void;
}

export function SourceChip({ src, open, onClick }: SourceChipProps) {
  const vis = sourceVisual(src);
  const Icon = vis.icon;
  const date = chipDate(src.date);
  return (
    <button
      type="button"
      className={"kn-chip" + (open ? " open" : "")}
      onClick={onClick}
      aria-label={"Source: " + src.label}
    >
      {vis.img ? (
        <img src={vis.img} alt="" width={13} height={13} />
      ) : Icon ? (
        <Icon size={12} />
      ) : null}
      <span className="kn-chip-label">{src.label}</span>
      {date ? <span className="kn-chip-date">{date}</span> : null}
    </button>
  );
}
