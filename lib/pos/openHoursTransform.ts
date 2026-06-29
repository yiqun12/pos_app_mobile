import { parseJsonField } from "@/lib/firestore/serialize";

export type WebOpenHoursDay = {
  timeRanges: Array<{ openTime: string; closeTime: string }>;
  timezone: string;
};

export type WebOpenHours = Record<string, WebOpenHoursDay>;

export const EDITOR_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const INDEX_TO_EDITOR_DAY: Record<string, (typeof EDITOR_DAYS)[number]> = {
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
  "7": "Sun",
};

const EDITOR_DAY_TO_INDEX: Record<(typeof EDITOR_DAYS)[number], string> = {
  Mon: "1",
  Tue: "2",
  Wed: "3",
  Thu: "4",
  Fri: "5",
  Sat: "6",
  Sun: "7",
};

const DEFAULT_WEB_OPEN_HOURS: WebOpenHours = {
  "0": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "1": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "2": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "3": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "4": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "5": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "6": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
  "7": { timeRanges: [{ openTime: "0900", closeTime: "2200" }], timezone: "ET" },
};

function normalizeWebOpenHours(raw: unknown): WebOpenHours {
  const parsed =
    typeof raw === "string"
      ? parseJsonField<WebOpenHours>(raw, DEFAULT_WEB_OPEN_HOURS)
      : ((raw as WebOpenHours | null) ?? DEFAULT_WEB_OPEN_HOURS);

  return Object.keys(parsed).length > 0 ? parsed : DEFAULT_WEB_OPEN_HOURS;
}

function isEditorFormat(raw: Record<string, unknown>): boolean {
  return EDITOR_DAYS.some((day) => typeof raw[day] === "string");
}

function formatWebTime(value: string): string {
  if (!value || value === "xxxx") return "";
  const digits = value.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function parseEditorTime(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(0, 4);
  return digits.padStart(4, "0");
}

function isClosedEditorValue(value?: string): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "closed" || normalized.includes("休息");
}

/** Convert eatifyPos Open_time JSON into WorkingHoursEditor day map. */
export function webOpenHoursToEditor(raw: unknown): Record<string, string> {
  const parsed =
    typeof raw === "string"
      ? parseJsonField<Record<string, unknown>>(raw, {})
      : ((raw as Record<string, unknown> | null) ?? {});

  if (isEditorFormat(parsed)) {
    return EDITOR_DAYS.reduce<Record<string, string>>((acc, day) => {
      acc[day] = String(parsed[day] ?? "Closed");
      return acc;
    }, {});
  }

  const webHours = normalizeWebOpenHours(parsed);
  const editorHours: Record<string, string> = {};

  for (const [index, day] of Object.entries(INDEX_TO_EDITOR_DAY)) {
    const dayData = webHours[index];
    const range = dayData?.timeRanges?.[0];
    if (
      !range ||
      range.openTime === "xxxx" ||
      range.closeTime === "xxxx" ||
      !range.openTime ||
      !range.closeTime
    ) {
      editorHours[day] = "Closed";
      continue;
    }

    editorHours[day] = `${formatWebTime(range.openTime)}-${formatWebTime(range.closeTime)}`;
  }

  return editorHours;
}

/** Convert WorkingHoursEditor day map back to eatifyPos Open_time JSON shape. */
export function editorOpenHoursToWeb(
  editorHours: Record<string, string>,
  existingRaw?: unknown
): WebOpenHours {
  const existing = normalizeWebOpenHours(existingRaw);
  const timezone = existing["1"]?.timezone ?? existing["7"]?.timezone ?? "ET";
  const next: WebOpenHours = { ...existing };

  for (const day of EDITOR_DAYS) {
    const index = EDITOR_DAY_TO_INDEX[day];
    const value = editorHours[day];

    if (isClosedEditorValue(value)) {
      next[index] = {
        timeRanges: [{ openTime: "xxxx", closeTime: "xxxx" }],
        timezone,
      };
      continue;
    }

    const [open = "09:00", close = "22:00"] = value
      .replace("–", "-")
      .split("-")
      .map((part) => part.trim());

    next[index] = {
      timeRanges: [{ openTime: parseEditorTime(open), closeTime: parseEditorTime(close) }],
      timezone,
    };
  }

  next["0"] = {
    timeRanges: [...(next["7"]?.timeRanges ?? [{ openTime: "xxxx", closeTime: "xxxx" }])],
    timezone,
  };

  return next;
}

export function applyMondayHoursToAllDays(
  editorHours: Record<string, string>
): Record<string, string> {
  const monday =
    editorHours.Mon && !isClosedEditorValue(editorHours.Mon)
      ? editorHours.Mon
      : "09:00-22:00";

  return EDITOR_DAYS.reduce<Record<string, string>>((acc, day) => {
    acc[day] = monday;
    return acc;
  }, {});
}
