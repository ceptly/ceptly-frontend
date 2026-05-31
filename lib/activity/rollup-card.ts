export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatActivityLatestLabel(iso: string): string {
  const date = new Date(iso);
  const formatted = date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (isSameCalendarDay(date, new Date())) {
    return `Today · ${formatted}`;
  }

  return formatted;
}

export function pastSessionsLabel(sessionCount: number): string | null {
  if (sessionCount <= 1) {
    return null;
  }
  const past = sessionCount - 1;
  return `${past} past session${past === 1 ? "" : "s"}`;
}

export type RollupCardStatus = "none" | "needs_attention" | "complete";

export function rollupStatusFromCounts(
  responded: number,
  expected: number,
  hasSession: boolean,
  missingCount = 0,
): RollupCardStatus {
  if (!hasSession || expected === 0) {
    return "none";
  }

  if (responded >= expected && missingCount === 0) {
    return "complete";
  }

  return "needs_attention";
}
