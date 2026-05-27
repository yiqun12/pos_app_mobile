import type { MenuItem, OptionGroup } from "../../types/menu";

export type WebAttributeVariation = {
  type?: string;
  price?: number | string;
};

export type WebAttributeGroup = {
  isSingleSelected?: boolean;
  variations?: WebAttributeVariation[];
};

export type WebAttributesArr = Record<string, WebAttributeGroup>;

export type WebMenuItem = {
  id?: string;
  name?: string;
  CHI?: string;
  price?: number | string;
  subtotal?: number | string;
  category?: string;
  categoryCHI?: string;
  categoryId?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  attributesArr?: unknown;
  attributes?: unknown;
  attributes2?: unknown;
};

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMaybeJsonObject<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function transformWebAttributes(raw: unknown): WebAttributesArr {
  return parseMaybeJsonObject<WebAttributesArr>(raw, {});
}

export function transformWebAttributesToOptionGroups(raw: unknown): OptionGroup[] {
  const attributes = transformWebAttributes(raw);
  return Object.entries(attributes).map(([groupName, group]) => ({
    id: groupName,
    name: groupName,
    type: group.isSingleSelected ? "single" : "multi",
    required: false,
    choices: (group.variations ?? []).map((variation) => {
      const choiceName = variation.type ?? "";
      return {
        id: `${groupName}-${choiceName}`,
        name: choiceName,
        priceAdjustment: parseNumber(variation.price, 0),
      };
    }),
  }));
}

export function transformWebMenuItem(raw: WebMenuItem, index: number): MenuItem {
  const rawName = raw.name ?? "Untitled";
  const nameCN = raw.CHI && raw.CHI !== rawName ? raw.CHI : undefined;
  const categoryId = raw.categoryId ?? raw.category ?? "uncategorized";
  const priceSource = raw.price ?? raw.subtotal;
  const attributesArr = transformWebAttributes(raw.attributesArr);
  const optionGroups = transformWebAttributesToOptionGroups(attributesArr);

  return {
    id: raw.id ?? `item-${index}`,
    categoryId,
    categoryName: raw.category,
    categoryNameCN: raw.categoryCHI,
    name: nameCN ? `${rawName} / ${nameCN}` : rawName,
    rawName,
    nameCN,
    price: parseNumber(priceSource, 0),
    imageUrl: raw.imageUrl ?? raw.image,
    description: raw.description,
    attributesArr,
    optionGroups: optionGroups.length > 0 ? optionGroups : undefined,
  };
}
