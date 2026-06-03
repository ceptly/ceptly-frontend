"use client";

import { Label } from "@/components/ui/label";
import type { SlackChannel } from "@/lib/api/slack-channels";
import { agentPillVariants } from "@/lib/agents-ui";
import { cn } from "@/lib/utils";

interface ChannelChipsPickerProps {
  channels: SlackChannel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  /** When "single", selecting a channel replaces the selection. */
  selectionMode?: "multiple" | "single";
}

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}

export function ChannelChipsPicker({
  channels,
  selectedIds,
  onChange,
  disabled = false,
  error,
  label = "Where rollups land",
  selectionMode = "multiple",
}: ChannelChipsPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No channels found. Invite the Ceptly bot to a channel, then refresh
          this page.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => {
            const selected = selectedIds.includes(channel.id);
            return (
              <button
                key={channel.id}
                type="button"
                disabled={disabled}
                className={cn(agentPillVariants({ selected }))}
                onClick={() => {
                  if (selectionMode === "single") {
                    onChange(
                      selectedIds.includes(channel.id) ? [] : [channel.id],
                    );
                    return;
                  }
                  onChange(toggleId(selectedIds, channel.id));
                }}
              >
                <span className="font-bold text-[color:var(--brand-green-soft)]">
                  #
                </span>
                {channel.name}
                {channel.is_private ? " (private)" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
