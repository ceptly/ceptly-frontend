export const SCHEDULE_INTERVAL_MINUTES = 15;

const TIME_LOCAL_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 24 * 60;

export function minutesSinceMidnightFromTimeLocal(timeLocal: string): number {
  const match = TIME_LOCAL_PATTERN.exec(timeLocal);
  if (!match) {
    return 0;
  }

  return (
    Number.parseInt(match[1] ?? "0", 10) * 60 +
    Number.parseInt(match[2] ?? "0", 10)
  );
}

/** Next 15-minute cron tick at or after the scheduled local time. */
export function effectiveCronFireMinutes(scheduledMinutes: number): number {
  const normalized =
    ((scheduledMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  if (normalized % SCHEDULE_INTERVAL_MINUTES === 0) {
    return normalized;
  }

  const ceiled =
    Math.ceil(normalized / SCHEDULE_INTERVAL_MINUTES) *
    SCHEDULE_INTERVAL_MINUTES;

  return ceiled >= MINUTES_PER_DAY ? 0 : ceiled;
}

export function effectiveCronFireTimeLocal(timeLocal: string): string {
  const fireMinutes = effectiveCronFireMinutes(
    minutesSinceMidnightFromTimeLocal(timeLocal),
  );
  const hours = Math.floor(fireMinutes / 60);
  const minutes = fireMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
