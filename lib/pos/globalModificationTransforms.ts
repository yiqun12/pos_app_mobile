export type WebGlobalModification = {
  type?: string;
  price?: number | string;
  typeCategory?: string;
};

export type AppGlobalModification = {
  id: string;
  type: string;
  price: number;
  typeCategory: "要求添加" | "要求减少";
};

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function transformGlobalModifications(raw: unknown): AppGlobalModification[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { list?: unknown }).list)
      ? (raw as { list: unknown[] }).list
      : [];

  return list.map((item, index) => {
    const modification = item && typeof item === "object"
      ? item as WebGlobalModification
      : {};
    return {
      id: `gm-${index}`,
      type: modification.type ?? "",
      price: parseNumber(modification.price, 0),
      typeCategory: modification.typeCategory === "要求减少" ? "要求减少" : "要求添加",
    };
  });
}
