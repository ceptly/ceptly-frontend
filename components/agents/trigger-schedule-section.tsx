"use client";

import { CalendarClock, Hand, Zap } from "lucide-react";

import { ScheduleTimePicker } from "@/components/settings/schedule-time-picker";
import { TimezonePicker } from "@/components/settings/timezone-picker";
import { Label } from "@/components/ui/label";
import type { AgentTriggerMode } from "@/lib/agents";
import {
  SCHEDULE_PRESETS,
  type SchedulePresetId,
  schedulePresetFromSchedule,
} from "@/lib/agents";
import type { ScheduleFrequency } from "@/lib/api/types";
import {
  agentFieldHintClass,
  agentPillVariants,
  agentSegmentButtonVariants,
  agentSegmentClass,
} from "@/lib/agents-ui";
import { cn } from "@/lib/utils";

interface TriggerScheduleSectionProps {
  triggerMode: AgentTriggerMode;
  onTriggerModeChange: (mode: AgentTriggerMode) => void;
  timezone: string;
  frequency: ScheduleFrequency;
  daysOfWeek: number[];
  timeLocal: string;
  onTimezoneChange: (value: string) => void;
  onFrequencyChange: (value: ScheduleFrequency) => void;
  onDaysOfWeekChange: (days: number[]) => void;
  onTimeLocalChange: (value: string) => void;
  disabled?: boolean;
}

const TRIGGER_OPTIONS: {
  id: AgentTriggerMode;
  label: string;
  icon: typeof CalendarClock;
  disabled?: boolean;
}[] = [
  { id: "schedule", label: "On a schedule", icon: CalendarClock },
  { id: "event", label: "On an event", icon: Zap, disabled: true },
  { id: "manual", label: "Manually", icon: Hand },
];

export function TriggerScheduleSection({
  triggerMode,
  onTriggerModeChange,
  timezone,
  frequency,
  daysOfWeek,
  timeLocal,
  onTimezoneChange,
  onFrequencyChange,
  onDaysOfWeekChange,
  onTimeLocalChange,
  disabled = false,
}: TriggerScheduleSectionProps) {
  const activePreset =
    schedulePresetFromSchedule(frequency, daysOfWeek) ?? "weekdays";

  function applyPreset(presetId: SchedulePresetId) {
    const preset = SCHEDULE_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    onFrequencyChange(preset.frequency);
    onDaysOfWeekChange(preset.days_of_week);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className={agentSegmentClass} role="tablist">
          {TRIGGER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = triggerMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={disabled || option.disabled}
                title={option.disabled ? "Coming soon" : undefined}
                className={cn(
                  agentSegmentButtonVariants({ active }),
                )}
                onClick={() => {
                  if (!option.disabled) {
                    onTriggerModeChange(option.id);
                    if (option.id === "schedule") {
                      applyPreset(activePreset);
                    }
                  }
                }}
              >
                <Icon className="size-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
        {triggerMode === "schedule" ? null : (
          <p className={agentFieldHintClass}>
            {triggerMode === "manual"
              ? "Runs once when you deploy. No recurring schedule."
              : "Event triggers are coming soon."}
          </p>
        )}
      </div>

      {triggerMode === "schedule" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                className={cn(
                  agentPillVariants({ selected: activePreset === preset.id }),
                )}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-run-at">Run at</Label>
            <ScheduleTimePicker
              id="agent-run-at"
              value={timeLocal}
              onChange={onTimeLocalChange}
              disabled={disabled}
              className="max-w-[164px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-timezone">Timezone</Label>
            <TimezonePicker
              id="agent-timezone"
              value={timezone}
              onChange={onTimezoneChange}
              disabled={disabled}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
