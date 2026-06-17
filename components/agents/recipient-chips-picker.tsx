"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RosterMember } from "@/lib/api/roster";
import {
  agentChipAddClass,
  agentChipClass,
  agentChipsContainerClass,
} from "@/lib/agents-ui";
import { getActiveRosterMembers } from "@/lib/chat-mentions";
import { cn } from "@/lib/utils";

interface RecipientChipsPickerProps {
  members: RosterMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  label?: string;
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

export function RecipientChipsPicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
  label = "Recipients",
}: RecipientChipsPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  // Reset highlight when the user types or (re)opens the picker. We drive this
  // from the event sites rather than an effect to avoid setState-in-effect.
  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const addMember = (memberId: string) => {
    if (disabled || selectedIds.includes(memberId)) {
      return;
    }
    onChange([...selectedIds, memberId]);
    setQuery("");
    setHighlightIndex(0);
  };

  const removeMember = (memberId: string) => {
    if (disabled) {
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
        Add team members to your roster before assigning them to an agent.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <Label>{label}</Label>
      <div className={agentChipsContainerClass}>
        {selectedMembers.map((member) => (
          <span key={member.id} className={agentChipClass} title={member.email}>
            <Avatar size="sm" className="size-5">
              <AvatarFallback className="text-[9px]">
                {getInitials(member.display_name)}
              </AvatarFallback>
            </Avatar>
            {member.display_name}
            <button
              type="button"
              className="inline-flex text-muted-foreground hover:text-foreground"
              onClick={() => removeMember(member.id)}
              disabled={disabled}
              aria-label={`Remove ${member.display_name}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className={agentChipAddClass}
          disabled={disabled || availableMembers.length === 0}
          onClick={() => {
            setSearchOpen((open) => {
              const next = !open;
              if (next) {
                // Reset highlight when (re)opening so arrow nav starts at top.
                setHighlightIndex(0);
              }
              return next;
            });
          }}
        >
          <Plus className="size-3.5" />
          Add people
        </button>
      </div>

      {searchOpen && !disabled ? (
        <div className="space-y-2 rounded-lg border border-[color:var(--border-strong)] bg-card/50 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={(event) => {
                if (suggestions.length === 0) {
                  if (event.key === "Escape") {
                    closeSearch();
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
                  closeSearch();
                }
              }}
              placeholder="Search team members..."
              className="pl-9"
              aria-expanded
              aria-autocomplete="list"
              role="combobox"
            />
          </div>
          <div
            role="listbox"
            aria-label="Team member suggestions"
            className="max-h-48 overflow-y-auto"
          >
            {suggestions.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
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
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm",
                    index === highlightIndex
                      ? "bg-muted"
                      : "hover:bg-muted/80",
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
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
  );
}
