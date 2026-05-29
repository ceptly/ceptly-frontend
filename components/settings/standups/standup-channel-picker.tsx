"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { SlackChannel } from "@/lib/api/slack-channels";

interface StandupChannelPickerProps {
  slackChannels: SlackChannel[];
  slackChannelsError?: string | null;
  selectedChannelId: string;
  onChange: (channelId: string) => void;
  disabled?: boolean;
}

export function StandupChannelPicker({
  slackChannels,
  slackChannelsError,
  selectedChannelId,
  onChange,
  disabled = false,
}: StandupChannelPickerProps) {
  const selected = slackChannels.find((channel) => channel.id === selectedChannelId);

  return (
    <div className="space-y-2">
      <Label>Slack channel</Label>
      {slackChannelsError ? (
        <p className="text-sm text-destructive">{slackChannelsError}</p>
      ) : slackChannels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No channels found. Invite the Ceptly bot to a channel, then refresh
          this page.
        </p>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                disabled={disabled}
              />
            }
          >
            <span className="truncate">
              {selected ? `#${selected.name}` : "Select a channel"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 w-[var(--anchor-width)]">
            <DropdownMenuRadioGroup
              value={selectedChannelId}
              onValueChange={onChange}
            >
              {slackChannels.map((channel) => (
                <DropdownMenuRadioItem key={channel.id} value={channel.id}>
                  #{channel.name}
                  {channel.is_private ? " (private)" : ""}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
