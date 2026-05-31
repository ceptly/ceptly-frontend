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

export function snapScheduleTimeToInterval(timeLocal: string): string {
  const match = TIME_LOCAL_PATTERN.exec(timeLocal);
  if (!match) {
    return timeLocal;
  }

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const totalMinutes = hours * 60 + minutes;
  const snapped =
    Math.round(totalMinutes / SCHEDULE_INTERVAL_MINUTES) *
    SCHEDULE_INTERVAL_MINUTES;
  const snappedHours = Math.floor(snapped / 60) % 24;
  const snappedMinutes = snapped % 60;

  return `${String(snappedHours).padStart(2, "0")}:${String(snappedMinutes).padStart(2, "0")}`;
}

export function formatTimeLocal12h(timeLocal: string): string {
  const match = TIME_LOCAL_PATTERN.exec(timeLocal);
  if (!match) {
    return timeLocal;
  }

  let hours = Number.parseInt(match[1] ?? "0", 10);
  const minutePart = match[2] ?? "00";
  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutePart} ${period}`;
}

function buildScheduleTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let total = 0; total < MINUTES_PER_DAY; total += SCHEDULE_INTERVAL_MINUTES) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    options.push({ value, label: formatTimeLocal12h(value) });
  }
  return options;
}

export const SCHEDULE_TIME_OPTIONS = buildScheduleTimeOptions();
