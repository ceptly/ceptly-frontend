export const SCHEDULE_INTERVAL_MINUTES = 15;

const TIME_LOCAL_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isScheduleTimeOnInterval(timeLocal: string): boolean {
  const match = TIME_LOCAL_PATTERN.exec(timeLocal);
  if (!match) {
    return false;
  }

  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return minutes % SCHEDULE_INTERVAL_MINUTES === 0;
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
