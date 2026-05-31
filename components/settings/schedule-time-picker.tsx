"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatTimeLocal12h,
  SCHEDULE_TIME_OPTIONS,
  snapScheduleTimeToInterval,
} from "@/lib/schedule/cron-fire";
import { cn } from "@/lib/utils";

interface ScheduleTimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ScheduleTimePicker({
  id,
  value,
  onChange,
  disabled = false,
  className,
}: ScheduleTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedRef = useRef<HTMLDivElement>(null);
  const snappedValue = snapScheduleTimeToInterval(value);
  const displayLabel = formatTimeLocal12h(snappedValue);

  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "max-w-xs justify-between font-normal",
              className,
            )}
            disabled={disabled}
          />
        }
      >
        <span>{displayLabel}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64 w-[var(--anchor-width)]">
        <DropdownMenuRadioGroup
          value={snappedValue}
          onValueChange={(next) => {
            onChange(next);
            setOpen(false);
          }}
        >
          {SCHEDULE_TIME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              ref={option.value === snappedValue ? selectedRef : undefined}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
