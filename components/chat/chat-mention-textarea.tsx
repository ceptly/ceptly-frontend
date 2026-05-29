"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea, textareaVariants } from "@/components/ui/textarea";
import {
  filterChannelsForMentionQuery,
  filterMembersForMentionQuery,
  findActiveChannelMention,
  findActiveMention,
  getActiveRosterMembers,
  insertChannelMention,
  insertMention,
  MENTION_COMPOSER_WRAP_CLASS,
  MENTION_HIGHLIGHT_COLOR,
  MENTION_TEXT_CLASS,
  normalizeCompletedMentionSpaces,
  splitTextWithMentionSegments,
  type ActiveMentionState,
} from "@/lib/chat-mentions";
import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";
import { getTextareaCaretCoordinates } from "@/lib/textarea-caret";
import { cn } from "@/lib/utils";

interface ChatMentionTextareaProps extends Omit<
  ComponentProps<typeof Textarea>,
  "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  rosterMembers: RosterMember[];
  slackChannels?: SlackChannel[];
  /** Enter sends; Shift+Enter inserts a newline. */
  onEnter?: (value: string) => void;
  submitOnEnter?: boolean;
}

interface MentionDropdownPosition {
  /** Dropdown top when opening below the caret. */
  top: number;
  /** Caret line top — used when flipping above. */
  caretTop: number;
  left: number;
}

function dropdownPositionsEqual(
  left: MentionDropdownPosition | null,
  right: MentionDropdownPosition | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.top === right.top &&
    left.left === right.left &&
    left.caretTop === right.caretTop
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function MentionValueMirror({
  value,
  rosterMembers,
  slackChannels,
}: {
  value: string;
  rosterMembers: RosterMember[];
  slackChannels: SlackChannel[];
}) {
  const segments = splitTextWithMentionSegments(
    value,
    rosterMembers,
    slackChannels,
  );

  if (segments.length === 0) {
    return <span className="text-foreground">{"\u00a0"}</span>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "mention" || segment.type === "channel_mention" ? (
          <span key={`mention-${index}`} className={MENTION_TEXT_CLASS}>
            {segment.content}
          </span>
        ) : (
          <span key={`text-${index}`} className="text-foreground">
            {segment.content}
          </span>
        ),
      )}
    </>
  );
}

function MentionMemberDropdown({
  open,
  position,
  query,
  suggestions,
  highlightIndex,
  rosterMembers,
  onHighlight,
  onSelect,
}: {
  open: boolean;
  position: MentionDropdownPosition | null;
  query: string;
  suggestions: RosterMember[];
  highlightIndex: number;
  rosterMembers: RosterMember[];
  onHighlight: (index: number) => void;
  onSelect: (member: RosterMember) => void;
}) {
  if (!open || !position || typeof document === "undefined") {
    return null;
  }

  const viewportPadding = 8;
  const dropdownWidth = 300;
  const clampedLeft = Math.min(
    Math.max(viewportPadding, position.left),
    window.innerWidth - dropdownWidth - viewportPadding,
  );
  const spaceBelow = window.innerHeight - position.top - viewportPadding;
  const openAbove = spaceBelow < 220;
  const top = openAbove
    ? Math.max(viewportPadding, position.caretTop - 8)
    : position.top;

  return createPortal(
    <div
      role="listbox"
      aria-label="Mention team member"
      className={cn(
        "fixed z-50 w-[300px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10",
        openAbove && "-translate-y-full",
      )}
      style={{
        top,
        left: clampedLeft,
      }}
    >
      <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
        {query.trim() ? "Matching members" : "Members"}
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {suggestions.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {getActiveRosterMembers(rosterMembers).length === 0
              ? "No team members on your roster yet."
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
                index !== highlightIndex && "hover:bg-muted/80",
              )}
              style={
                index === highlightIndex
                  ? { backgroundColor: MENTION_HIGHLIGHT_COLOR }
                  : undefined
              }
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(member);
              }}
            >
              <Avatar size="sm">
                <AvatarFallback className="text-xs">
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
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
    </div>,
    document.body,
  );
}

function MentionChannelDropdown({
  open,
  position,
  query,
  suggestions,
  highlightIndex,
  onHighlight,
  onSelect,
}: {
  open: boolean;
  position: MentionDropdownPosition | null;
  query: string;
  suggestions: SlackChannel[];
  highlightIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (channel: SlackChannel) => void;
}) {
  if (!open || !position || typeof document === "undefined") {
    return null;
  }

  const viewportPadding = 8;
  const dropdownWidth = 300;
  const clampedLeft = Math.min(
    Math.max(viewportPadding, position.left),
    window.innerWidth - dropdownWidth - viewportPadding,
  );
  const spaceBelow = window.innerHeight - position.top - viewportPadding;
  const openAbove = spaceBelow < 220;
  const top = openAbove
    ? Math.max(viewportPadding, position.caretTop - 8)
    : position.top;

  return createPortal(
    <div
      role="listbox"
      aria-label="Mention Slack channel"
      className={cn(
        "fixed z-50 w-[300px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10",
        openAbove && "-translate-y-full",
      )}
      style={{
        top,
        left: clampedLeft,
      }}
    >
      <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
        {query.trim() ? "Matching channels" : "Slack channels"}
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {suggestions.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No matching Slack channels.
          </p>
        ) : (
          suggestions.map((channel, index) => (
            <button
              key={channel.id}
              type="button"
              role="option"
              aria-selected={index === highlightIndex}
              className={cn(
                "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none",
                index !== highlightIndex && "hover:bg-muted/80",
              )}
              style={
                index === highlightIndex
                  ? { backgroundColor: MENTION_HIGHLIGHT_COLOR }
                  : undefined
              }
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(channel);
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  #{channel.name}
                </span>
                {channel.is_private ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    Private channel
                  </span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ChatMentionTextarea({
  value,
  onChange,
  rosterMembers,
  slackChannels = [],
  onEnter,
  submitOnEnter = true,
  disabled,
  onKeyDown,
  className,
  variant = "chat",
  ...props
}: ChatMentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const [dropdownPosition, setDropdownPosition] =
    useState<MentionDropdownPosition | null>(null);

  const activeMemberMention = mentionDismissed
    ? null
    : findActiveMention(value, cursor, rosterMembers);
  const activeChannelMention =
    mentionDismissed || activeMemberMention
      ? null
      : findActiveChannelMention(value, cursor, slackChannels);
  const activeMention = activeMemberMention ?? activeChannelMention;
  const mentionKind = activeMemberMention
    ? "member"
    : activeChannelMention
      ? "channel"
      : null;
  const memberSuggestions = activeMemberMention
    ? filterMembersForMentionQuery(rosterMembers, activeMemberMention.query)
    : [];
  const channelSuggestions = activeChannelMention
    ? filterChannelsForMentionQuery(
        slackChannels,
        activeChannelMention.query,
      )
    : [];
  const suggestions =
    mentionKind === "channel" ? channelSuggestions : memberSuggestions;
  const menuOpen = !!activeMention;
  const mentionPickerActive = menuOpen && suggestions.length > 0;
  const mentionStart = activeMention?.start ?? null;
  const mentionQuery = activeMention?.query ?? "";

  useEffect(() => {
    setHighlightIndex(0);
  }, [mentionQuery, mentionStart]);

  const syncDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStart === null) {
      setDropdownPosition((previous) => (previous === null ? previous : null));
      return;
    }

    const caret = getTextareaCaretCoordinates(textarea, mentionStart + 1);
    const nextPosition: MentionDropdownPosition = {
      top: caret.top + caret.height + 6,
      caretTop: caret.top,
      left: caret.left,
    };

    setDropdownPosition((previous) =>
      dropdownPositionsEqual(previous, nextPosition) ? previous : nextPosition,
    );
  }, [mentionStart]);

  useLayoutEffect(() => {
    if (!menuOpen) {
      setDropdownPosition((previous) => (previous === null ? previous : null));
      return;
    }
    syncDropdownPosition();
  }, [menuOpen, value, cursor, mentionStart, syncDropdownPosition]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const handleReposition = () => syncDropdownPosition();
    textarea.addEventListener("scroll", handleReposition);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      textarea.removeEventListener("scroll", handleReposition);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [menuOpen, syncDropdownPosition]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) {
      return;
    }

    const syncMirrorScroll = () => {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    };

    syncMirrorScroll();
    textarea.addEventListener("scroll", syncMirrorScroll);
    return () => textarea.removeEventListener("scroll", syncMirrorScroll);
  }, [value]);

  const syncCursor = useCallback(() => {
    const nextCursor = textareaRef.current?.selectionStart ?? 0;
    setCursor(nextCursor);
  }, []);

  const applyMemberMention = useCallback(
    (member: RosterMember, mention: ActiveMentionState) => {
      const { value: nextValue, cursor: nextCursor } = insertMention(
        value,
        cursor,
        mention,
        member,
      );
      onChange(nextValue);
      setMentionDismissed(true);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
        setCursor(nextCursor);
      });
    },
    [cursor, onChange, value],
  );

  const applyChannelMention = useCallback(
    (channel: SlackChannel, mention: ActiveMentionState) => {
      const { value: nextValue, cursor: nextCursor } = insertChannelMention(
        value,
        cursor,
        mention,
        channel,
      );
      onChange(nextValue);
      setMentionDismissed(true);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
          return;
        }
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
        setCursor(nextCursor);
      });
    },
    [cursor, onChange, value],
  );

  const selectHighlighted = useCallback(() => {
    if (!activeMention || suggestions.length === 0) {
      return false;
    }
    if (mentionKind === "channel") {
      const channel = channelSuggestions[highlightIndex] ?? channelSuggestions[0];
      if (!channel) {
        return false;
      }
      applyChannelMention(channel, activeMention);
      return true;
    }
    const member = memberSuggestions[highlightIndex] ?? memberSuggestions[0];
    if (!member) {
      return false;
    }
    applyMemberMention(member, activeMention);
    return true;
  }, [
    activeMention,
    applyChannelMention,
    applyMemberMention,
    channelSuggestions,
    highlightIndex,
    memberSuggestions,
    mentionKind,
    suggestions.length,
  ]);

  return (
    <div className="relative">
      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          MENTION_COMPOSER_WRAP_CLASS,
          textareaVariants({ variant }),
          "block text-base md:text-sm",
        )}
      >
        <MentionValueMirror
          value={value}
          rosterMembers={rosterMembers}
          slackChannels={slackChannels}
        />
      </div>
      <Textarea
        ref={textareaRef}
        variant={variant}
        value={value}
        disabled={disabled}
        className={cn(
          "relative bg-transparent text-transparent caret-foreground selection:bg-primary/20 selection:text-transparent",
          MENTION_COMPOSER_WRAP_CLASS,
          className,
        )}
        onChange={(event) => {
          const rawValue = event.target.value;
          const nextValue = normalizeCompletedMentionSpaces(
            rawValue,
            rosterMembers,
            slackChannels,
          );
          onChange(nextValue);
          setCursor(event.target.selectionStart ?? 0);
          setMentionDismissed(false);
        }}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
        onKeyDown={(event) => {
          if (mentionPickerActive) {
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
            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              selectHighlighted();
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setMentionDismissed(true);
              return;
            }
          }

          if (
            submitOnEnter &&
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing &&
            !mentionPickerActive
          ) {
            event.preventDefault();
            const currentValue = textareaRef.current?.value ?? value;
            onEnter?.(currentValue);
            return;
          }

          onKeyDown?.(event);
        }}
        {...props}
      />
      {mentionKind === "channel" ? (
        <MentionChannelDropdown
          open={menuOpen}
          position={dropdownPosition}
          query={mentionQuery}
          suggestions={channelSuggestions}
          highlightIndex={highlightIndex}
          onHighlight={setHighlightIndex}
          onSelect={(channel) => {
            if (!activeChannelMention) {
              return;
            }
            applyChannelMention(channel, activeChannelMention);
          }}
        />
      ) : (
        <MentionMemberDropdown
          open={menuOpen}
          position={dropdownPosition}
          query={mentionQuery}
          suggestions={memberSuggestions}
          highlightIndex={highlightIndex}
          rosterMembers={rosterMembers}
          onHighlight={setHighlightIndex}
          onSelect={(member) => {
            if (!activeMemberMention) {
              return;
            }
            applyMemberMention(member, activeMemberMention);
          }}
        />
      )}
    </div>
  );
}
