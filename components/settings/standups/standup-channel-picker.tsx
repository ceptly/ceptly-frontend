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
import type { ChatChannel, CommunicationPlatform } from "@/lib/api/communication";

interface StandupChannelPickerProps {
  channels: ChatChannel[];
  channelsError?: string | null;
  selectedChannelId: string;
  onChange: (channelId: string) => void;
  disabled?: boolean;
  platform?: CommunicationPlatform;
}

const PLATFORM_LABEL: Record<CommunicationPlatform, string> = {
  slack: "Slack channel",
  clickup: "ClickUp channel",
  teams: "Teams channel",
};

const PLATFORM_PREFIX: Record<CommunicationPlatform, string> = {
  slack: "#",
  clickup: "#",
  teams: "#",
};

const PLATFORM_EMPTY_HINT: Record<CommunicationPlatform, string> = {
  slack: "No channels found. Invite the Ceptly bot to a channel, then refresh this page.",
  clickup: "No channels found. Make sure Ceptly has access in ClickUp Chat, then refresh this page.",
  teams: "Microsoft Teams is not yet supported.",
};

export function StandupChannelPicker({
  channels,
  channelsError,
  selectedChannelId,
  onChange,
  disabled = false,
  platform = "slack",
}: StandupChannelPickerProps) {
  const selected = channels.find((channel) => channel.id === selectedChannelId);
  const prefix = PLATFORM_PREFIX[platform];

  return (
    <div className="space-y-2">
      <Label>{PLATFORM_LABEL[platform]}</Label>
      {channelsError ? (
        <p className="text-sm text-destructive">{channelsError}</p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {PLATFORM_EMPTY_HINT[platform]}
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
              {selected ? `${prefix}${selected.name}` : "Select a channel"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 w-[var(--anchor-width)]">
            <DropdownMenuRadioGroup
              value={selectedChannelId}
              onValueChange={onChange}
            >
              {channels.map((channel) => (
                <DropdownMenuRadioItem key={channel.id} value={channel.id}>
                  {prefix}
                  {channel.name}
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
