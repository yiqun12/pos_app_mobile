export type RevenueBusinessDayWindow = {
  start: string;
  end: string;
};

const BUSINESS_DAY_START_HOUR = 5;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toFirestoreDateTime(date: Date, centiseconds: string): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    centiseconds,
  ].join("-");
}

function toDisplayDateTime(dateTime: string): string {
  const parts = dateTime.split("-");
  if (parts.length < 6) return dateTime;
  const [year, month, day, hour, minute] = parts;
  return `${month}/${day}/${year} ${hour}:${minute}`;
}

export function getBusinessDayWindow(now = new Date()): RevenueBusinessDayWindow {
  const start = new Date(now);
  start.setHours(BUSINESS_DAY_START_HOUR, 0, 0, 0);

  if (now.getHours() < BUSINESS_DAY_START_HOUR) {
    start.setDate(start.getDate() - 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(BUSINESS_DAY_START_HOUR - 1, 59, 59, 990);

  return {
    start: toFirestoreDateTime(start, "00"),
    end: toFirestoreDateTime(end, "99"),
  };
}

export function formatBusinessDayLabel(window: RevenueBusinessDayWindow): string {
  return `${toDisplayDateTime(window.start)} - ${toDisplayDateTime(window.end)}`;
}
