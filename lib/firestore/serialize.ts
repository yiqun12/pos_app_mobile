/**
 * Safely parse a JSON field that web stores as stringified JSON.
 * Returns fallback on any error (missing field, invalid JSON, wrong type).
 */
export function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[firestore/serialize] parse failed:", err);
    return fallback;
  }
}

/**
 * Stringify back for write — keeps compatibility with web.
 */
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Parse a numeric string (e.g., TaxRate stored as "8.5"). Returns fallback if NaN.
 */
export function parseNumericField(raw: unknown, fallback: number): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : fallback;
  if (typeof raw !== "string") return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
