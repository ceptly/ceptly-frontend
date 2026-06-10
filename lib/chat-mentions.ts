import type { RosterMember } from "@/lib/api/roster";
import type { SlackChannel } from "@/lib/api/slack-channels";

/** Bright mention text on dark backgrounds (dark mode composer, user bubbles). */
export const MENTION_TEXT_COLOR = "#b5a5ff";
/** Darker mention text for readability on light backgrounds. */
export const MENTION_TEXT_COLOR_LIGHT = "#745ae6";
/** 50% opacity highlight for mention picker selection */
export const MENTION_HIGHLIGHT_COLOR = "rgba(116, 90, 230, 0.4)";

export const MENTION_TEXT_CLASS = "ceptly-mention";

/** Keep mirror overlay wrapping in sync with the textarea. */
export const MENTION_COMPOSER_WRAP_CLASS = "whitespace-pre-wrap break-words";

/** @mention token with non-breaking spaces so names do not wrap mid-mention. */
export function formatMentionInsertion(displayName: string): string {
  return `@${displayName.replace(/ /g, "\u00a0")}`;
}

/** #channel mention token with non-breaking spaces in multi-word names. */
export function formatChannelMentionInsertion(channelName: string): string {
  return `#${channelName.replace(/ /g, "\u00a0")}`;
}

export interface ActiveMentionState {
  query: string;
  start: number;
}

export function getActiveRosterMembers(
  members: RosterMember[],
): RosterMember[] {
  return members.filter((member) => !member.paused);
}

function isCursorAfterCompletedMention(
  value: string,
  atIndex: number,
  cursor: number,
  members: RosterMember[],
): boolean {
  const activeMembers = [...getActiveRosterMembers(members)].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );

  for (const member of activeMembers) {
    const match = value
      .slice(atIndex)
      .match(buildMentionRegExp(member.display_name, "\\s|$|[.,!?;:]"));
    if (!match) {
      continue;
    }

    const mentionEnd = atIndex + match[0].length;
    const nextChar = value[mentionEnd] ?? "";
    const hasMentionTerminator = !nextChar || /[\s.,!?;:]/.test(nextChar);
    if (!hasMentionTerminator) {
      continue;
    }

    if (cursor > mentionEnd) {
      return true;
    }
  }

  return false;
}

export function findActiveMention(
  value: string,
  cursor: number,
  members: RosterMember[] = [],
): ActiveMentionState | null {
  const beforeCursor = value.slice(0, cursor);
  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex === -1) {
    return null;
  }

  const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : "";
  if (charBeforeAt && !/\s/.test(charBeforeAt)) {
    return null;
  }

  if (isCursorAfterCompletedMention(value, atIndex, cursor, members)) {
    return null;
  }

  const query = beforeCursor.slice(atIndex + 1);
  if (query.includes("\n")) {
    return null;
  }

  return { query, start: atIndex };
}

export function filterMembersForMentionQuery(
  members: RosterMember[],
  query: string,
): RosterMember[] {
  const activeMembers = getActiveRosterMembers(members);
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return activeMembers;
  }

  return activeMembers.filter((member) => {
    const displayName = member.display_name.toLowerCase();
    const emailLocal = member.email.split("@")[0]?.toLowerCase() ?? "";
    return (
      displayName.includes(normalizedQuery) ||
      emailLocal.includes(normalizedQuery)
    );
  });
}

export function insertMention(
  value: string,
  cursor: number,
  mention: ActiveMentionState,
  member: RosterMember,
): { value: string; cursor: number } {
  const before = value.slice(0, mention.start);
  const after = value.slice(cursor);
  const insertion = `${formatMentionInsertion(member.display_name)} `;
  const nextValue = `${before}${insertion}${after}`;
  return {
    value: nextValue,
    cursor: mention.start + insertion.length,
  };
}

function isCursorAfterCompletedChannelMention(
  value: string,
  hashIndex: number,
  cursor: number,
  channels: SlackChannel[],
): boolean {
  const sortedChannels = [...channels].sort(
    (left, right) => right.name.length - left.name.length,
  );

  for (const channel of sortedChannels) {
    const match = value
      .slice(hashIndex)
      .match(buildChannelMentionRegExp(channel.name, "\\s|$|[.,!?;:]"));
    if (!match) {
      continue;
    }

    const mentionEnd = hashIndex + match[0].length;
    const nextChar = value[mentionEnd] ?? "";
    const hasMentionTerminator = !nextChar || /[\s.,!?;:]/.test(nextChar);
    if (!hasMentionTerminator) {
      continue;
    }

    if (cursor > mentionEnd) {
      return true;
    }
  }

  return false;
}

export function findActiveChannelMention(
  value: string,
  cursor: number,
  channels: SlackChannel[] = [],
): ActiveMentionState | null {
  const beforeCursor = value.slice(0, cursor);
  const hashIndex = beforeCursor.lastIndexOf("#");
  if (hashIndex === -1) {
    return null;
  }

  const charBeforeHash = hashIndex > 0 ? beforeCursor[hashIndex - 1] : "";
  if (charBeforeHash && !/\s/.test(charBeforeHash)) {
    return null;
  }

  if (isCursorAfterCompletedChannelMention(value, hashIndex, cursor, channels)) {
    return null;
  }

  const query = beforeCursor.slice(hashIndex + 1);
  if (query.includes("\n")) {
    return null;
  }

  return { query, start: hashIndex };
}

export function filterChannelsForMentionQuery(
  channels: SlackChannel[],
  query: string,
): SlackChannel[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return channels;
  }

  return channels.filter((channel) =>
    channel.name.toLowerCase().includes(normalizedQuery),
  );
}

export function insertChannelMention(
  value: string,
  cursor: number,
  mention: ActiveMentionState,
  channel: SlackChannel,
): { value: string; cursor: number } {
  const before = value.slice(0, mention.start);
  const after = value.slice(cursor);
  const insertion = `${formatChannelMentionInsertion(channel.name)} `;
  const nextValue = `${before}${insertion}${after}`;
  return {
    value: nextValue,
    cursor: mention.start + insertion.length,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMentionNamePattern(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp)
    .join("[\\s\\u00a0]");
}

function buildMentionRegExp(
  displayName: string,
  terminator: string,
  flags = "",
): RegExp {
  return new RegExp(
    `@${buildMentionNamePattern(displayName)}(?=${terminator})`,
    flags,
  );
}

function buildChannelMentionRegExp(
  channelName: string,
  terminator: string,
  flags = "",
): RegExp {
  return new RegExp(
    `#${buildMentionNamePattern(channelName)}(?=${terminator})`,
    flags,
  );
}

export type MentionTextSegment =
  | { type: "text"; content: string }
  | { type: "mention"; content: string; displayName: string }
  | { type: "channel_mention"; content: string; channelName: string };

interface MentionRange {
  start: number;
  end: number;
  kind: "member" | "channel";
  displayName: string;
}

function findMentionRanges(
  text: string,
  members: RosterMember[],
): MentionRange[] {
  const activeMembers = getActiveRosterMembers(members);
  const sortedMembers = [...activeMembers].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );
  const ranges: MentionRange[] = [];

  for (const member of sortedMembers) {
    const pattern = buildMentionRegExp(
      member.display_name,
      "\\s|$|[.,!?;:\\n]",
      "g",
    );
    let match = pattern.exec(text);
    while (match) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        kind: "member",
        displayName: member.display_name,
      });
      match = pattern.exec(text);
    }
  }

  return ranges;
}

function findChannelMentionRanges(
  text: string,
  channels: SlackChannel[],
): MentionRange[] {
  const sortedChannels = [...channels].sort(
    (left, right) => right.name.length - left.name.length,
  );
  const ranges: MentionRange[] = [];

  for (const channel of sortedChannels) {
    const pattern = buildChannelMentionRegExp(
      channel.name,
      "\\s|$|[.,!?;:\\n]",
      "g",
    );
    let match = pattern.exec(text);
    while (match) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        kind: "channel",
        displayName: channel.name,
      });
      match = pattern.exec(text);
    }
  }

  return ranges;
}

function mergeMentionRanges(ranges: MentionRange[]): MentionRange[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: MentionRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.start < previous.end) {
      continue;
    }
    merged.push(range);
  }
  return merged;
}

/** Split plain text into normal spans and completed @ / # mentions for rich display. */
export function splitTextWithMentionSegments(
  text: string,
  members: RosterMember[] = [],
  channels: SlackChannel[] = [],
): MentionTextSegment[] {
  if (!text) {
    return [];
  }

  const mergedRanges = mergeMentionRanges([
    ...findMentionRanges(text, members),
    ...findChannelMentionRanges(text, channels),
  ]);

  const segments: MentionTextSegment[] = [];
  let cursor = 0;

  for (const range of mergedRanges) {
    if (range.start > cursor) {
      segments.push({
        type: "text",
        content: text.slice(cursor, range.start),
      });
    }
    const content = text.slice(range.start, range.end);
    if (range.kind === "channel") {
      segments.push({
        type: "channel_mention",
        content,
        channelName: range.displayName,
      });
    } else {
      segments.push({
        type: "mention",
        content,
        displayName: range.displayName,
      });
    }
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}

function normalizeMentionRangeSpaces(text: string, ranges: MentionRange[]): string {
  if (ranges.length === 0) {
    return text;
  }

  let result = text;
  for (const range of [...ranges].reverse()) {
    const token = result.slice(range.start, range.end);
    const normalized = token.replace(/ /g, "\u00a0");
    if (normalized !== token) {
      result =
        result.slice(0, range.start) + normalized + result.slice(range.end);
    }
  }

  return result;
}

/** Replace regular spaces inside completed @mentions with non-breaking spaces. */
export function normalizeCompletedMentionSpaces(
  text: string,
  members: RosterMember[],
  channels: SlackChannel[] = [],
): string {
  return normalizeMentionRangeSpaces(text, [
    ...findMentionRanges(text, members),
    ...findChannelMentionRanges(text, channels),
  ]);
}

export function resolveMentionedMembers(
  content: string,
  members: RosterMember[],
): RosterMember[] {
  const activeMembers = getActiveRosterMembers(members);
  const sortedMembers = [...activeMembers].sort(
    (left, right) => right.display_name.length - left.display_name.length,
  );
  const mentioned: RosterMember[] = [];
  const mentionedIds = new Set<string>();

  for (const member of sortedMembers) {
    const pattern = buildMentionRegExp(
      member.display_name,
      "\\s|$|[.,!?;:]",
      "i",
    );
    if (pattern.test(content) && !mentionedIds.has(member.id)) {
      mentioned.push(member);
      mentionedIds.add(member.id);
    }
  }

  return mentioned;
}

export function resolveMentionedChannels(
  content: string,
  channels: SlackChannel[],
): SlackChannel[] {
  const sortedChannels = [...channels].sort(
    (left, right) => right.name.length - left.name.length,
  );
  const mentioned: SlackChannel[] = [];
  const mentionedIds = new Set<string>();

  for (const channel of sortedChannels) {
    const pattern = buildChannelMentionRegExp(
      channel.name,
      "\\s|$|[.,!?;:]",
      "i",
    );
    if (pattern.test(content) && !mentionedIds.has(channel.id)) {
      mentioned.push(channel);
      mentionedIds.add(channel.id);
    }
  }

  return mentioned;
}

/** Append roster and channel ids so agents can resolve mentions reliably. */
export function formatMessageWithMentionContext(
  content: string,
  members: RosterMember[] = [],
  channels: SlackChannel[] = [],
): string {
  const mentionedMembers = resolveMentionedMembers(content, members);
  const mentionedChannels = resolveMentionedChannels(content, channels);

  if (mentionedMembers.length === 0 && mentionedChannels.length === 0) {
    return content;
  }

  const blocks: string[] = [content];

  if (mentionedMembers.length > 0) {
    const references = mentionedMembers
      .map((member) => `${member.display_name} (roster id: ${member.id})`)
      .join(", ");
    blocks.push(`[Referenced team members: ${references}]`);
  }

  if (mentionedChannels.length > 0) {
    const references = mentionedChannels
      .map((channel) => `#${channel.name} (channel id: ${channel.id})`)
      .join(", ");
    blocks.push(`[Referenced Slack channels: ${references}]`);
  }

  return blocks.join("\n\n");
}
