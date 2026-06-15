import { cva } from "class-variance-authority";

export const agentChipsContainerClass =
  "flex min-h-11 flex-wrap items-center gap-1.5 border border-[color:var(--border-strong)] bg-white/[0.03] p-2 dark:bg-white/[0.03]";

export const agentChipClass =
  "inline-flex items-center gap-1.5 border border-border bg-muted py-1 pr-2 pl-1 text-[12.5px]";

export const agentChipAddClass =
  "inline-flex items-center gap-1.5 border border-dashed border-[color:var(--border-strong)] bg-transparent px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

export const agentPillVariants = cva(
  "px-3 py-1.5 text-xs font-semibold border transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "border-[color:var(--green-line)] bg-[color:var(--green-wash)] text-[color:var(--brand-green-soft)]",
        false:
          "border-border bg-muted text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export const agentSegmentClass =
  "inline-flex gap-0.5 border border-border bg-muted p-0.5";

export const agentSegmentButtonVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      active: {
        true: "bg-card text-foreground shadow-sm",
        false: "bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const agentSectionTitleClass = "text-sm font-bold";

export const agentFieldHintClass = "mt-1.5 text-xs text-muted-foreground";
