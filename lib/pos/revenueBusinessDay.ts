export type RevenueBusinessDayWindow = {
  start: string;
  end: string;
};

const BUSINESS_DAY_START_HOUR = 5;
const DEFAULT_TIME_ZONE = "America/Los_Angeles";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toFirestoreDateTime(date: Date, centiseconds: string): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    centiseconds,
  ].join("-");
}

function toDisplayDateTime(dateTime: string): string {
  const parts = dateTime.split("-");
  if (parts.length < 6) return dateTime;
  const [year, month, day, hour, minute] = parts;
  return `${month}/${day}/${year} ${hour}:${minute}`;
}

function parseFirestoreUtcDateTime(dateTime: string): Date | null {
  const parts = dateTime.split("-");
  if (parts.length < 7) return null;
  const [year, month, day, hour, minute, second, centisecond] = parts.map(Number);
  if ([year, month, day, hour, minute, second, centisecond].some((value) => !Number.isFinite(value))) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, centisecond * 10));
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
}

function partsAsUtcMs(parts: ReturnType<typeof getZonedParts>): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
}

function zonedTimeToUtc(
  parts: ReturnType<typeof getZonedParts>,
  timeZone: string,
  millisecond = 0
): Date {
  let utcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    millisecond
  );

  for (let i = 0; i < 3; i += 1) {
    const actualParts = getZonedParts(new Date(utcMs), timeZone);
    const diff = partsAsUtcMs(parts) - partsAsUtcMs(actualParts);
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function datePartsFromUtcDate(utcDate: Date) {
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

export function deriveStoreTimeZone(zip?: string, state?: string): string {
  const normalizedState = state?.trim().toUpperCase();
  if (normalizedState) {
    if (normalizedState === "AK") return "America/Anchorage";
    if (normalizedState === "HI") return "Pacific/Honolulu";
    if (["CA", "NV", "OR", "WA"].includes(normalizedState)) return "America/Los_Angeles";
    if (["AZ"].includes(normalizedState)) return "America/Phoenix";
    if (["CO", "ID", "MT", "NM", "UT", "WY"].includes(normalizedState)) return "America/Denver";
    if (["AL", "AR", "IA", "IL", "KS", "LA", "MN", "MO", "MS", "ND", "NE", "OK", "SD", "TX", "WI"].includes(normalizedState)) {
      return "America/Chicago";
    }
    return "America/New_York";
  }

  const zipPrefix = (zip ?? "").replace(/\D/g, "").slice(0, 3);
  if (zipPrefix.length < 3) return DEFAULT_TIME_ZONE;
  const prefix = Number(zipPrefix);
  if (!Number.isFinite(prefix)) return DEFAULT_TIME_ZONE;
  if (prefix >= 995 && prefix <= 999) return "America/Anchorage";
  if (prefix >= 967 && prefix <= 968) return "Pacific/Honolulu";
  if ((prefix >= 900 && prefix <= 961) || (prefix >= 970 && prefix <= 994) || (prefix >= 889 && prefix <= 898)) {
    return "America/Los_Angeles";
  }
  if ((prefix >= 800 && prefix <= 884) || (prefix >= 590 && prefix <= 599)) {
    return "America/Denver";
  }
  if (prefix >= 850 && prefix <= 865) return "America/Phoenix";
  if ((prefix >= 500 && prefix <= 588) || (prefix >= 600 && prefix <= 799)) {
    return "America/Chicago";
  }
  return "America/New_York";
}

export function getBusinessDayWindow(
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE
): RevenueBusinessDayWindow {
  const zonedNow = getZonedParts(now, timeZone);
  let businessDateUtc = Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day);

  if (zonedNow.hour < BUSINESS_DAY_START_HOUR) {
    businessDateUtc -= 24 * 60 * 60 * 1000;
  }

  const startDateParts = datePartsFromUtcDate(new Date(businessDateUtc));
  const endDateParts = datePartsFromUtcDate(new Date(businessDateUtc + 24 * 60 * 60 * 1000));

  const start = zonedTimeToUtc(
    { ...startDateParts, hour: BUSINESS_DAY_START_HOUR, minute: 0, second: 0 },
    timeZone
  );
  const end = zonedTimeToUtc(
    { ...endDateParts, hour: BUSINESS_DAY_START_HOUR - 1, minute: 59, second: 59 },
    timeZone,
    990
  );

  return {
    start: toFirestoreDateTime(start, "00"),
    end: toFirestoreDateTime(end, "99"),
  };
}

function formatDateTimeInZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${pad(parts.month)}/${pad(parts.day)}/${parts.year} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatBusinessDayLabel(
  window: RevenueBusinessDayWindow,
  timeZone?: string
): string {
  if (timeZone) {
    const start = parseFirestoreUtcDateTime(window.start);
    const end = parseFirestoreUtcDateTime(window.end);
    if (start && end) {
      return `${formatDateTimeInZone(start, timeZone)} - ${formatDateTimeInZone(end, timeZone)}`;
    }
  }
  return `${toDisplayDateTime(window.start)} - ${toDisplayDateTime(window.end)}`;
}
