"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getTimezoneLabel,
  groupTimezonesByRegion,
  TIMEZONE_OPTIONS,
} from "@/lib/schedule/timezones";
import { cn } from "@/lib/utils";

interface TimezonePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimezonePicker({
  id,
  value,
  onChange,
  disabled = false,
  className,
}: TimezonePickerProps) {
  const timezoneGroups = groupTimezonesByRegion();
  const hasKnownValue = TIMEZONE_OPTIONS.some((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-auto w-full max-w-md justify-between rounded-none border border-[color:var(--border-strong)] bg-background px-3 py-2 text-sm font-normal shadow-none hover:bg-muted/50",
              className,
            )}
          />
        }
      >
        <span className="truncate">{getTimezoneLabel(value)}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-64 w-[var(--anchor-width)]">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {!hasKnownValue ? (
            <DropdownMenuRadioItem value={value}>{value}</DropdownMenuRadioItem>
          ) : null}
          {Object.entries(timezoneGroups).map(([region, options]) => (
            <DropdownMenuGroup key={region}>
              <DropdownMenuLabel>{region}</DropdownMenuLabel>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
