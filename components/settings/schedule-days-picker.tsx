"use client";

import { Label } from "@/components/ui/label";
import { DAY_OPTIONS, toggleDayInList } from "@/lib/schedule/days";

interface ScheduleDaysPickerProps {
  daysOfWeek: number[];
  onChange: (daysOfWeek: number[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function ScheduleDaysPicker({
  daysOfWeek,
  onChange,
  disabled = false,
  showLabel = true,
}: ScheduleDaysPickerProps) {
  return (
    <div className="space-y-2">
      {showLabel ? <Label>Days</Label> : null}
      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map((day) => {
          const selected = daysOfWeek.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(toggleDayInList(daysOfWeek, day.value))}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
