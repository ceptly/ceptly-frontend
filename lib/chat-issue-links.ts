/** Replace markdown star list markers with standard bullet characters. */
export function normalizeAssistantBullets(text: string): string {
  return text.replace(/(^|\n)\*\s+/g, "$1• ");
}

export interface IssueLinkTextSegment {
  type: "text";
  content: string;
}

export interface IssueLinkReferenceSegment {
  type: "issue";
  identifier: string;
  url: string;
  title?: string;
}

export type AssistantMessageSegment =
  | IssueLinkTextSegment
  | IssueLinkReferenceSegment;

interface IssueLinkRange {
  start: number;
  end: number;
  identifier: string;
  url: string;
  title?: string;
}

const MARKDOWN_ISSUE_WITH_TITLE =
  /\[([A-Z][A-Z0-9]+-\d+)\]\(([^)]+)\)\s*(?::\s*|\s+)([^\n]+)/g;

const MARKDOWN_ISSUE_LINK = /\[([A-Z][A-Z0-9]+-\d+)\]\(([^)]+)\)/g;

const SLACK_ISSUE_LINK =
  /<([^|>]+)\|([A-Z][A-Z0-9]+-\d+)>\s*(?::\s*|—\s+|-\s+)?([^\n]*)/g;

function mergeIssueLinkRanges(ranges: IssueLinkRange[]): IssueLinkRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: IssueLinkRange[] = [sorted[0]!];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    const previous = merged[merged.length - 1]!;

    if (current.start < previous.end) {
      if (current.end > previous.end) {
        previous.end = current.end;
        previous.title = previous.title ?? current.title;
      }
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function findIssueLinkRanges(text: string): IssueLinkRange[] {
  const ranges: IssueLinkRange[] = [];

  for (const match of text.matchAll(MARKDOWN_ISSUE_WITH_TITLE)) {
    const identifier = match[1];
    const url = match[2];
    const title = match[3]?.trim();
    if (!identifier || !url || !title) {
      continue;
    }

    ranges.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      identifier,
      url,
      title,
    });
  }

  for (const match of text.matchAll(SLACK_ISSUE_LINK)) {
    const url = match[1];
    const identifier = match[2];
    if (!identifier || !url) {
      continue;
    }

    const title = match[3]?.trim();
    ranges.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      identifier,
      url,
      title: title || undefined,
    });
  }

  for (const match of text.matchAll(MARKDOWN_ISSUE_LINK)) {
    const identifier = match[1];
    const url = match[2];
    if (!identifier || !url) {
      continue;
    }

    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (ranges.some((range) => start >= range.start && end <= range.end)) {
      continue;
    }

    ranges.push({
      start,
      end,
      identifier,
      url,
    });
  }

  return mergeIssueLinkRanges(ranges);
}

export function splitTextWithIssueLinkSegments(
  text: string,
): AssistantMessageSegment[] {
  if (!text) {
    return [];
  }

  const ranges = findIssueLinkRanges(text);
  if (ranges.length === 0) {
    return [{ type: "text", content: text }];
  }

  const segments: AssistantMessageSegment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({
        type: "text",
        content: text.slice(cursor, range.start),
      });
    }

    segments.push({
      type: "issue",
      identifier: range.identifier,
      url: range.url,
      title: range.title,
    });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}
