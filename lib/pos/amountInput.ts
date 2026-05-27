export function normalizeAmountInput(value: string): string | null {
  const normalized = value.replace(/。/g, ".").trim();
  if (!/^\d*\.?\d*$/.test(normalized)) return null;
  return normalized;
}

export function appendAmountKey(currentValue: string, key: string): string {
  const current = normalizeAmountInput(currentValue) ?? "";
  if (key === "backspace") return current.slice(0, -1);
  if (key === "clear") return "";
  if (key === ".") {
    if (current.includes(".")) return current;
    return current.length === 0 ? "0." : `${current}.`;
  }
  if (key === "00") {
    if (current.length === 0 || current === "0") return "0";
    return `${current}00`;
  }
  if (/^\d$/.test(key)) {
    if (current === "0") return key;
    return `${current}${key}`;
  }
  return current;
}

export function parseAmountInput(value: string): number {
  const normalized = normalizeAmountInput(value);
  if (!normalized || normalized === ".") return 0;
  const parsed = Number(normalized.endsWith(".") ? `${normalized}0` : normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(Math.max(0, parsed) * 100) / 100;
}
