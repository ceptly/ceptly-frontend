"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";
import { getActiveRosterMembers } from "@/lib/chat-mentions";
import { cn } from "@/lib/utils";

interface RosterMemberPickerProps {
  members: RosterMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function filterMembers(members: RosterMember[], query: string): RosterMember[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return members;
  }

  return members.filter((member) => {
    const name = member.display_name.toLowerCase();
    const email = member.email.toLowerCase();
    return name.includes(normalized) || email.includes(normalized);
  });
}

export function RosterMemberPicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
}: RosterMemberPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const activeMembers = useMemo(
    () => getActiveRosterMembers(members),
    [members],
  );

  const selectedMembers = useMemo(
    () =>
      selectedIds
        .map((id) => activeMembers.find((member) => member.id === id))
        .filter((member): member is RosterMember => member != null),
    [activeMembers, selectedIds],
  );

  const availableMembers = useMemo(
    () => activeMembers.filter((member) => !selectedIds.includes(member.id)),
    [activeMembers, selectedIds],
  );

  const suggestions = useMemo(
    () => filterMembers(availableMembers, query),
    [availableMembers, query],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const addMember = (memberId: string) => {
    if (disabled || selectedIds.includes(memberId)) {
      return;
    }
    onChange([...selectedIds, memberId]);
    setQuery("");
    setHighlightIndex(0);
    inputRef.current?.focus();
  };

  const removeMember = (memberId: string) => {
    if (disabled || selectedIds.length <= 1) {
      return;
    }
    onChange(selectedIds.filter((id) => id !== memberId));
  };

  const selectHighlighted = () => {
    const member = suggestions[highlightIndex];
    if (member) {
      addMember(member.id);
    }
  };

  if (activeMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add team members to your roster before assigning them to a conversation.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Team members</Label>

      {selectedMembers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => {
            const canRemove = selectedIds.length > 1 && !disabled;
            return (
              <Badge
                key={member.id}
                variant="secondary"
                className="gap-1 pr-1"
                title={member.email}
              >
                {member.display_name}
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${member.display_name}`}
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            );
          })}
        </div>
      ) : null}

      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!open || suggestions.length === 0) {
              if (event.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlightIndex(
                (current) => (current + 1) % suggestions.length,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightIndex(
                (current) =>
                  (current - 1 + suggestions.length) % suggestions.length,
              );
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              selectHighlighted();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search team members..."
          className="pl-9"
          disabled={disabled || availableMembers.length === 0}
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />

        {open && !disabled ? (
          <div
            role="listbox"
            aria-label="Team member suggestions"
            className="absolute top-[calc(100%+0.25rem)] z-50 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {suggestions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {availableMembers.length === 0
                    ? "All team members are already selected."
                    : "No matching team members."}
                </p>
              ) : (
                suggestions.map((member, index) => (
                  <button
                    key={member.id}
                    type="button"
                    role="option"
                    aria-selected={index === highlightIndex}
                    className={cn(
                      "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none",
                      index === highlightIndex
                        ? "bg-muted"
                        : "hover:bg-muted/80",
                    )}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => addMember(member.id)}
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {member.display_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
