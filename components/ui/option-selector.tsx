"use client";

import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const optionTileVariants = cva(
  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "border-primary bg-primary/5 text-foreground dark:border-white/30",
        false:
          "border-border bg-background text-foreground hover:bg-muted/50 dark:border-white/10",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export interface OptionSelectorItem<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface OptionSelectorProps<T extends string> {
  mode: "single" | "multiple";
  options: OptionSelectorItem<T>[];
  value: T | T[] | null;
  onChange: (value: T | T[]) => void;
  className?: string;
}

export function OptionSelector<T extends string>({
  mode,
  options,
  value,
  onChange,
  className,
}: OptionSelectorProps<T>) {
  const isSelected = (optionValue: T) => {
    if (mode === "single") {
      return value === optionValue;
    }
    return Array.isArray(value) && value.includes(optionValue);
  };

  const toggle = (optionValue: T) => {
    if (mode === "single") {
      onChange(optionValue);
      return;
    }

    const current = Array.isArray(value) ? value : [];
    if (current.includes(optionValue)) {
      onChange(current.filter((v) => v !== optionValue));
    } else {
      onChange([...current, optionValue]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role={mode === "single" ? "radio" : "checkbox"}
            aria-checked={selected}
            onClick={() => toggle(option.value)}
            className={optionTileVariants({ selected })}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              />
            ) : null}
            <span className="flex flex-1 flex-col gap-0.5">
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
