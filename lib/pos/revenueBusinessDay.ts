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

export type RevenueDatePreset =
  | "today"
  | "yesterday"
  | "thisMonth"
  | "lastMonth"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "lastQ1"
  | "lastQ2"
  | "lastQ3"
  | "lastQ4"
  | "custom";

export function formatRevenueDisplayDate(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${pad(parts.month)}/${pad(parts.day)}/${parts.year}`;
}

export function getRevenueBusinessDateKey(dateTime: string, timeZone: string): string {
  const parsed = parseFirestoreUtcDateTime(dateTime);
  if (!parsed) return dateTime;

  const zoned = getZonedParts(parsed, timeZone);
  let { year, month, day } = zoned;

  if (zoned.hour < BUSINESS_DAY_START_HOUR) {
    const previousDayUtc = Date.UTC(year, month - 1, day) - 24 * 60 * 60 * 1000;
    const previous = datePartsFromUtcDate(new Date(previousDayUtc));
    year = previous.year;
    month = previous.month;
    day = previous.day;
  }

  return `${month}/${day}`;
}

export function formatChartDateKey(
  year: number,
  month: number,
  day: number,
  includeYear: boolean
): string {
  if (includeYear) {
    return `${month}/${day}/${String(year).slice(-2)}`;
  }
  return `${month}/${day}`;
}

export function getChartDateKeyFromDateTime(
  dateTime: string,
  timeZone: string,
  includeYear: boolean
): string {
  const parsed = parseFirestoreUtcDateTime(dateTime);
  if (!parsed) return dateTime;
  const zoned = getZonedParts(parsed, timeZone);
  let { year, month, day } = zoned;

  if (zoned.hour < BUSINESS_DAY_START_HOUR) {
    const previousDayUtc = Date.UTC(year, month - 1, day) - 24 * 60 * 60 * 1000;
    const previous = datePartsFromUtcDate(new Date(previousDayUtc));
    year = previous.year;
    month = previous.month;
    day = previous.day;
  }

  return formatChartDateKey(year, month, day, includeYear);
}

export function iterateCalendarDaysInRevenueWindow(
  window: RevenueBusinessDayWindow,
  timeZone: string
): Array<{ year: number; month: number; day: number }> {
  const start = parseFirestoreUtcDateTime(window.start);
  const end = parseFirestoreUtcDateTime(window.end);
  if (!start || !end) return [];

  const startParts = getZonedParts(start, timeZone);
  let endParts = getZonedParts(end, timeZone);

  if (endParts.hour < BUSINESS_DAY_START_HOUR) {
    const previousDayUtc = Date.UTC(endParts.year, endParts.month - 1, endParts.day) - 24 * 60 * 60 * 1000;
    const previous = datePartsFromUtcDate(new Date(previousDayUtc));
    endParts = { ...endParts, ...previous };
  }

  const days: Array<{ year: number; month: number; day: number }> = [];
  let cursor = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
  const endMs = Date.UTC(endParts.year, endParts.month - 1, endParts.day);

  while (cursor <= endMs) {
    days.push(datePartsFromUtcDate(new Date(cursor)));
    cursor += 24 * 60 * 60 * 1000;
  }

  return days;
}

function getBusinessDayWindowForCalendarDate(
  year: number,
  month: number,
  day: number,
  timeZone: string
): RevenueBusinessDayWindow {
  const startDateParts = { year, month, day };
  const endDateParts = datePartsFromUtcDate(
    new Date(Date.UTC(year, month - 1, day) + 24 * 60 * 60 * 1000)
  );

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

function getRevenueWindowBetweenExclusiveEnd(
  startYear: number,
  startMonth: number,
  startDay: number,
  endExclusiveYear: number,
  endExclusiveMonth: number,
  endExclusiveDay: number,
  timeZone: string
): RevenueBusinessDayWindow {
  const start = zonedTimeToUtc(
    { year: startYear, month: startMonth, day: startDay, hour: BUSINESS_DAY_START_HOUR, minute: 0, second: 0 },
    timeZone
  );
  const endExclusive = zonedTimeToUtc(
    {
      year: endExclusiveYear,
      month: endExclusiveMonth,
      day: endExclusiveDay,
      hour: BUSINESS_DAY_START_HOUR,
      minute: 0,
      second: 0,
    },
    timeZone
  );
  const end = new Date(endExclusive.getTime() - 10);

  return {
    start: toFirestoreDateTime(start, "00"),
    end: toFirestoreDateTime(end, "99"),
  };
}

function shiftZonedMonth(parts: ReturnType<typeof getZonedParts>, deltaMonths: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + deltaMonths, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: 1,
  };
}

function getQuarterExclusiveEnd(year: number, quarter: 1 | 2 | 3 | 4) {
  if (quarter === 1) return { year, month: 4, day: 1 };
  if (quarter === 2) return { year, month: 7, day: 1 };
  if (quarter === 3) return { year, month: 10, day: 1 };
  return { year: year + 1, month: 1, day: 1 };
}

function getQuarterStart(year: number, quarter: 1 | 2 | 3 | 4) {
  if (quarter === 1) return { year, month: 1, day: 1 };
  if (quarter === 2) return { year, month: 4, day: 1 };
  if (quarter === 3) return { year, month: 7, day: 1 };
  return { year, month: 10, day: 1 };
}

export function getRevenueWindowForPreset(
  preset: RevenueDatePreset,
  timeZone: string,
  now = new Date(),
  custom?: { start: Date; end: Date | null }
): RevenueBusinessDayWindow {
  const zonedNow = getZonedParts(now, timeZone);

  if (preset === "today") {
    return getBusinessDayWindow(now, timeZone);
  }

  if (preset === "yesterday") {
    const yesterdayUtc = Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day) - 24 * 60 * 60 * 1000;
    const yesterday = datePartsFromUtcDate(new Date(yesterdayUtc));
    return getBusinessDayWindowForCalendarDate(yesterday.year, yesterday.month, yesterday.day, timeZone);
  }

  if (preset === "thisMonth") {
    const nextMonth = shiftZonedMonth({ ...zonedNow, day: 1 }, 1);
    return getRevenueWindowBetweenExclusiveEnd(
      zonedNow.year,
      zonedNow.month,
      1,
      nextMonth.year,
      nextMonth.month,
      1,
      timeZone
    );
  }

  if (preset === "lastMonth") {
    const lastMonth = shiftZonedMonth({ ...zonedNow, day: 1 }, -1);
    const thisMonth = shiftZonedMonth({ ...zonedNow, day: 1 }, 0);
    return getRevenueWindowBetweenExclusiveEnd(
      lastMonth.year,
      lastMonth.month,
      1,
      thisMonth.year,
      thisMonth.month,
      1,
      timeZone
    );
  }

  const quarterMap: Record<string, { yearOffset: number; quarter: 1 | 2 | 3 | 4 }> = {
    q1: { yearOffset: 0, quarter: 1 },
    q2: { yearOffset: 0, quarter: 2 },
    q3: { yearOffset: 0, quarter: 3 },
    q4: { yearOffset: 0, quarter: 4 },
    lastQ1: { yearOffset: -1, quarter: 1 },
    lastQ2: { yearOffset: -1, quarter: 2 },
    lastQ3: { yearOffset: -1, quarter: 3 },
    lastQ4: { yearOffset: -1, quarter: 4 },
  };

  const quarterPreset = quarterMap[preset];
  if (quarterPreset) {
    const year = zonedNow.year + quarterPreset.yearOffset;
    const start = getQuarterStart(year, quarterPreset.quarter);
    const endExclusive = getQuarterExclusiveEnd(year, quarterPreset.quarter);
    return getRevenueWindowBetweenExclusiveEnd(
      start.year,
      start.month,
      start.day,
      endExclusive.year,
      endExclusive.month,
      endExclusive.day,
      timeZone
    );
  }

  const startDate = custom?.start ?? now;
  const endDate = custom?.end ?? null;
  const startParts = getZonedParts(startDate, timeZone);

  if (!endDate) {
    return getBusinessDayWindowForCalendarDate(startParts.year, startParts.month, startParts.day, timeZone);
  }

  const endParts = getZonedParts(endDate, timeZone);
  const endExclusiveUtc = Date.UTC(endParts.year, endParts.month - 1, endParts.day) + 24 * 60 * 60 * 1000;
  const endExclusive = datePartsFromUtcDate(new Date(endExclusiveUtc));

  return getRevenueWindowBetweenExclusiveEnd(
    startParts.year,
    startParts.month,
    startParts.day,
    endExclusive.year,
    endExclusive.month,
    endExclusive.day,
    timeZone
  );
}
